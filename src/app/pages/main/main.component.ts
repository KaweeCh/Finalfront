import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { ImageRandom, User, imageUpload, imageUser } from '../../model/model';
import { ApiService } from '../../services/api-service';
import { ShareService } from '../../services/share.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog.component';
import $ from 'jquery';

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

  imageRandom : ImageRandom[] = [];
  leftImage: ImageRandom | undefined;
  rightImage: ImageRandom | undefined;
  K_FACTOR: number = 32;
  // public images: imageUser[] = [];
  canVote = true;
  isCD = true;
  httpError: boolean = false;
  leftImageError: boolean = false;
  login : boolean = false;
  async ngOnInit() {
    this.id = localStorage.getItem('userID');
    this.checkData();
    this.loadImages();

    $('.toggle').click(function (e: JQuery.Event) {
      e.preventDefault(); // The flicker is a codepen thing
      $(this).toggleClass('toggle-on');
    });
    if(this.shareData.userData?.type == 'owner'){
      this.router.navigate(['/login']);
    }

    if(this.shareData.userData){
      this.login = true;
    }else{
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
    
      // console.log(this.shareData.userData);
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
    const hashBigInt = BigInt('0x' + Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join(''));
    const machineId = parseInt(hashBigInt.toString().slice(0, 9));

    return machineId;
}

async reshuffleImages(winner: ImageRandom, loser: ImageRandom) {
  if (this.canVote) {
 
    this.canVote = false;
    await this.loadImages(); // รอให้โหลดรูปภาพเสร็จสมบูรณ์
    const ratings =  await this.calrating(winner, loser); // คำนวณคะแนน Elo สำหรับรูปภาพ
    console.log(ratings);
    setTimeout(() => {
      this.canVote = true;
    }, 2000); // 2 วินาที
  }
}

  

  async calrating(winner: ImageRandom, loser: ImageRandom) {
    const winnerEloRating = winner.count;
    const loserEloRating = loser.count;

    console.log(`Winner's old rating (${winner.imageID}): ${winnerEloRating}`);
    console.log(`Loser's old rating (${loser.imageID}): ${loserEloRating}`);

    const winnerExpectedScore = this.calculateExpectedScore(
      winnerEloRating,
      loserEloRating,
      winner.imageID.toString(), // แปลงเป็น string
      loser.imageID.toString() // แปลงเป็น string
    );
    const loserExpectedScore = this.calculateExpectedScore(
      loserEloRating,
      winnerEloRating,
      loser.imageID.toString(), // แปลงเป็น string
      winner.imageID.toString() // แปลงเป็น string
    );

    const plus = Math.round(this.K_FACTOR * (1 - winnerExpectedScore));
    const minus = Math.round(this.K_FACTOR * (0 - loserExpectedScore));

    console.log(`Plus for ${winner.imageID}: ${plus}`);
    console.log(`Minus for ${loser.imageID}: ${minus}`);

    const winnerNewRating = winnerEloRating + plus;
    const loserNewRating = loserEloRating + minus;

    console.log(`Winner's new rating (${winner.imageID}): ${winnerNewRating}`);
    console.log(`Loser's new rating (${loser.imageID}): ${loserNewRating}`);

    // ปัดคะแนนใหม่เป็นจำนวนเต็ม
    winner.count = Math.round(winnerNewRating);
    loser.count = Math.round(loserNewRating);

    console.log(
      'Winner is ' + winner.imageID + ' with new Elo rating: ' + winner.count
    );
    console.log(
      'Loser is ' + loser.imageID + ' with new Elo rating: ' + loser.count
    );

    const winnerBody = {
      userID: winner.userID,
      imageID: winner.imageID,
      elorating: plus,
    };
    const loserBody = {
      userID: loser.userID,
      imageID: loser.imageID,
      elorating: minus,
    };

    await this.api.updateScore(winner.imageID, winner.count);
    await this.api.updateScore(loser.imageID, loser.count);
    await this.api.vote(winnerBody);
    await this.api.vote(loserBody);

    return { plus, minus };
  }

  private calculateExpectedScore(
    playerRating: number,
    opponentRating: number,
    playerImageID: string,
    opponentImageID: string
  ): number {
    const exponent = (opponentRating - playerRating) / 400;
    const expectedScore = 1 / (1 + Math.pow(10, exponent));
    console.log(
      `Expected Score for ImageID ${opponentImageID}: ${expectedScore}`
    );
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

  navigateToUserProfile(userID : any) {
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

  countdownDuration: number = 10; // Set the countdown duration in seconds
  countdownInterval: any;

  // chooseRandomImages(select: imageUser, select2: imageUser) {
  //   const foundItemIndex = this.images.findIndex(
  //     (item) => item.imageID === select.imageID
  //   );

  //   const foundItemIndex2 = this.images.findIndex(
  //     (item) => item.imageID === select2.imageID
  //   );

  //   if (foundItemIndex !== -1 && foundItemIndex2 !== -1) {
  //     const chosenImage = this.images.splice(foundItemIndex, 1)[0];
  //     const chosenImage2 = this.images.splice(foundItemIndex2, 1)[0];
  //     // console.log('Removed images after vote:', chosenImage, chosenImage2);
  //     // console.log('all', this.images);

  //     if (this.images.length === 2) {
  //       this.canVote = false; // Disable further voting when only two images are left

  //       // Start the countdown
  //       this.countdownInterval = setInterval(() => {
  //         this.countdownDuration--;

  //         if (this.countdownDuration === 0) {
  //           clearInterval(this.countdownInterval);
  //           this.images.push(chosenImage, chosenImage2);
  //           console.log('Array after addition:', this.images);
  //           this.canVote = true;
  //           this.countdownDuration = 10; // Reset the countdown duration
  //         }
  //       }, 10);
  //     }
  //   } else {
  //     console.log(
  //       `Item with imageID ${select.imageID} or ${select2.imageID} not found in the array.`
  //     );
  //   }
  // }
}
