import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { ImageRandom, User } from '../../model/model';
import { ApiService } from '../../services/api-service';
import { ShareService } from '../../services/share.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss', './main.component loading.scss'],
})
export class MainComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  id: any;

  imageRandom: ImageRandom[] = [];
  leftImage: ImageRandom | undefined;
  rightImage: ImageRandom | undefined;
  K_FACTOR: number = 32;
  canVote = true;
  isCD = true;
  httpError: boolean = false;
  leftImageError: boolean = false;
  login: boolean = false;
  plus: number = 0;
  minus: number = 0;

  async ngOnInit() {
    this.id = localStorage.getItem('userID');
    this.checkData();
    this.loadImages();

    if (this.shareData.userData?.type == 'owner') {
      this.router.navigate(['/login']);
    }

    if (this.shareData.userData) {
      this.login = true;
    } else {
      this.login = false;
    }

    console.log(this.shareData.userData);
  }

  checkData() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        this.shareData.userData = userData;
      } catch (error) {
        console.error('Error parsing userData from localStorage:', error);
        this.loadData();
      }
    } else {
      this.loadData();
    }
  }

  async loadData() {
    if (!this.id) {
      return;
    }
    if (!localStorage.getItem('userData')) {
      this.shareData.userData = await this.api.getUserbyId(this.id);
      localStorage.setItem('userData', JSON.stringify(this.shareData.userData));
    }
  }

  async loadImages() {
    if (this.id) {
      const imageRandom = await this.api.randomImage(this.id);
      if (imageRandom) {
        this.imageRandom = imageRandom;
      }
    } else {
      const machineId = await this.getMachineId();
      const imageRandom = await this.api.randomImage(machineId);
      this.imageRandom = imageRandom;
    }
  }

  async getMachineId() {
    const dataToHash = `${navigator.userAgent}${navigator.platform}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashBigInt = BigInt(
      '0x' +
        Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
    );
    const machineId = parseInt(hashBigInt.toString().slice(0, 9));

    return machineId;
  }

  async reshuffleImages(winner: ImageRandom, loser: ImageRandom) {
    if (this.canVote) {
      this.canVote = false;
      const {
        plus,
        minus,
        winnerOldRating,
        winnerNewRating,
        loserOldRating,
        loserNewRating,
        winnerExpectedScore,
        loserExpectedScore,
      } = await this.calrating(winner, loser);

      console.log(`Winner's old rating: ${winnerOldRating}`);
      console.log(`Winner's new rating: ${winnerNewRating}`);
      console.log(`Winner's increased by: ${plus}`);
      console.log(`Winner's expected score: ${winnerExpectedScore}`);

      console.log(`Loser's old rating: ${loserOldRating}`);
      console.log(`Loser's new rating: ${loserNewRating}`);
      console.log(`Loser's decreased by: ${minus}`);
      console.log(`Loser's expected score: ${loserExpectedScore}`);

      if (this.isCD) {
        this.isCD = false;
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '900px',
          data: {
            winner: winner,
            loser: loser,
            winnerOldScore: winner.count,
            loserOldScore: loser.count,
            winnerExpectedScore: this.calculateExpectedScore(
              winner.count,
              loser.count,
              winner.imageID.toString(),
              loser.imageID.toString()
            ),
            loserExpectedScore: this.calculateExpectedScore(
              loser.count,
              winner.count,
              loser.imageID.toString(),
              winner.imageID.toString()
            ),
            plus: plus,
            minus: minus,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          this.shuffleImagesAfterDialogClosed(winner, loser);
        });
      } else {
        await this.loadImages();
        const ratings = await this.calrating(winner, loser);
        console.log(ratings);
        setTimeout(() => {
          this.canVote = true;
          this.isCD = true;
        }, 5000);
      }
    }
  }

  async shuffleImagesAfterDialogClosed(
    winner: ImageRandom,
    loser: ImageRandom
  ) {
    await this.loadImages();
    const ratings = await this.calrating(winner, loser);
    console.log(ratings);
    setTimeout(() => {
      this.canVote = true;
      this.isCD = true;
    }, 5000);
  }

  async calrating(winner: ImageRandom, loser: ImageRandom) {
    const winnerEloRating = winner.count;
    const loserEloRating = loser.count;

    // console.log(`Winner's old rating (${winner.imageID}): ${winnerEloRating}`);
    // console.log(`Loser's old rating (${loser.imageID}): ${loserEloRating}`);

    const winnerExpectedScore = this.calculateExpectedScore(
      winnerEloRating,
      loserEloRating,
      winner.imageID.toString(),
      loser.imageID.toString()
    );
    const loserExpectedScore = this.calculateExpectedScore(
      loserEloRating,
      winnerEloRating,
      loser.imageID.toString(),
      winner.imageID.toString()
    );

    const plus = Math.round(this.K_FACTOR * (1 - winnerExpectedScore));
    const minus = Math.round(this.K_FACTOR * (0 - loserExpectedScore));

    // console.log(`Plus for ${winner.imageID}: ${plus}`);
    // console.log(`Minus for ${loser.imageID}: ${minus}`);

    const winnerNewRating = winnerEloRating + plus;
    const loserNewRating = loserEloRating + minus;

    // console.log(`Winner's new rating (${winner.imageID}): ${winnerNewRating}`);
    // console.log(`Loser's new rating (${loser.imageID}): ${loserNewRating}`);

    winner.count = Math.round(winnerNewRating);
    loser.count = Math.round(loserNewRating);

    // console.log(
    //   'Winner is ' + winner.imageID + ' with new Elo rating: ' + winner.count
    // );
    // console.log(
    //   'Loser is ' + loser.imageID + ' with new Elo rating: ' + loser.count
    // );

    const winnerBody = {
      userID: winner.userID,
      imageID: winner.imageID,
      elorating: this.plus,
    };
    const loserBody = {
      userID: loser.userID,
      imageID: loser.imageID,
      elorating: this.minus,
    };

    await this.api.updateScore(winner.imageID, winner.count);
    await this.api.updateScore(loser.imageID, loser.count);
    await this.api.vote(winnerBody);
    await this.api.vote(loserBody);

    return {
      plus,
      minus,
      winnerOldRating: winnerEloRating,
      winnerNewRating: winnerNewRating,
      loserOldRating: loserEloRating,
      loserNewRating: loserNewRating,
      winnerExpectedScore,
      loserExpectedScore,
    };
  }

  private calculateExpectedScore(
    playerRating: number,
    opponentRating: number,
    playerImageID: string,
    opponentImageID: string
  ): number {
    const exponent = (opponentRating - playerRating) / 400;
    const expectedScore = 1 / (1 + Math.pow(10, exponent));
    // console.log(
    //   `Expected Score for ImageID ${opponentImageID}: ${expectedScore}`
    // );
    return expectedScore;
  }

  navigateToMain() {
    this.router.navigate(['/']);
  }

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  navigateToLogin() {
    localStorage.clear();
    this.router.navigate(['/login']);
    this.clearData();
  }

  navigateProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToUserProfile(userID: any) {
    const isLoggedIn = true;
    if (isLoggedIn) {
      this.router.navigate(['/ViewProfile', userID]);
    } else {
      this.alertMessage();
    }
  }

  alertMessage() {
    alert('You need to log in first!');
    localStorage.clear();
    this.router.navigate(['/login']);
    this.clearData();
  }

  navigateTop() {
    this.router.navigate(['/top10']);
  }

  clearData() {
    this.shareData.userData = undefined;
  }

  countdownDuration: number = 10;
  countdownInterval: any;
}
