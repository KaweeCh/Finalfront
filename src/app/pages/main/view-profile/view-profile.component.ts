import { Component, OnInit, ViewChild } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { User, imageUpload, imageUser, rankID } from '../../../model/model';
import { ApiService } from '../../../services/api-service';
import { ShareService } from '../../../services/share.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './view-profile.component.html',
  styleUrl: '../profile/profile.component.scss',
})
export class ViewProfileComponent {
  constructor(
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router,
    private dialog: MatDialog
  ) {}
  id: any;
  public images: imageUser[] = [];
  httpError: boolean = false;
  imageCount: number = 0;
  userData: User | undefined;
  Today: imageUser[] = [];
  Yesterday: imageUser[] = [];
  rank: rankID[] = [];
  async ngOnInit() {
    this.checkData();
    this.checkLogin();
    this.setData();
    this.getImage();
    console.log(this.userData);
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
      console.log(this.shareData.userData);
    }
  }

  async getImage() {
    this.getTopImageData();
    this.getRank(this.Today, this.Yesterday);
    await this.shareData.getImage(this.id);
    this.images = this.shareData.images;
    this.imageCount = this.images.length;
  }
  async getTopImageData() {
    this.Today = await this.api.gettodayrank();
    this.Yesterday = await this.api.getyesterdayrank();
    console.log('Today', this.Today);
    console.log('Yesterday', this.Yesterday);
    this.getRank(this.Today, this.Yesterday);
  }

  getRank(today: imageUser[], yesterday: imageUser[]): void {
    for (let i = 0; i < today.length; i++) {
      const todayImage = today[i];
      const yesterdayImage = yesterday.find(
        (img) => img.imageID === todayImage.imageID
      ); // Use '===' for comparison
      if (yesterdayImage) {
        const difference = yesterdayImage.rankYesterday - todayImage.rankToday; // Calculate the rank difference
        const rankNow: rankID = {
          imageID: todayImage.imageID,
          rankDiff: difference,
          url: todayImage.url,
          username: todayImage.username,
          voteScore: todayImage.count,
        };
        this.rank.push(rankNow);
      } else {
        // Handle if the image is new today and was not present yesterday
        const rankNow: rankID = {
          imageID: todayImage.imageID,
          rankDiff: 0,
          url: todayImage.url,
          username: todayImage.username,
          voteScore: todayImage.count,
        };
        this.rank.push(rankNow);
      }
    }
    console.log(this.rank);
  }

  async setData() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.userData = await this.api.getUserbyId(this.id);
  }

  checkLogin() {
    if (!localStorage.getItem('userData') || !localStorage.getItem('userID')) {
      this.navigateToLogin();
    }
  }

  navigateChart(imageId: number) {
    this.router.navigate(['/chart', imageId]);
  }

  navigateToMain() {
    this.router.navigate(['/']);
  }

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateAdmin() {
    if (this.shareData.userData?.type == 'owner') {
      this.router.navigate(['/admin/' + this.id]);
    } else {
      this.router.navigate(['/profile']);
    }
  }

  navigateTop() {
    this.router.navigate(['/top10']);
  }
}
