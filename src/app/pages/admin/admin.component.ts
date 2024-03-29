import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { ImageCount, User, imageUpload, imageUser } from '../../model/model';
import { ApiService } from '../../services/api-service';
import { ShareService } from '../../services/share.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  user: User[] = [];
  imgCount: ImageCount[] = [];
  id: any;
  userData: User | undefined;

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.id = localStorage.getItem('userID');
    await this.checkData();
    console.log(this.shareData.userData);
    this.user = await this.api.getUserMember();
    this.imgCount = await this.api.getImageCount();

    this.user.forEach(user => {
        const userImgCount = this.imgCount.find(item => item.userID === user.userID);
        if (!userImgCount) {
            this.imgCount.push({ userID: user.userID, image_count: 0 });
        }
    });
   
    console.log('user admin:', this.shareData.userData);
    if(!this.shareData.userData){
      this.router.navigate(['/login']);
    }
    console.log('users:', this.user);
    console.log('imgCount:', this.imgCount);
}


  checkData() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      this.shareData.userData = userData;
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

  navigateToMain() {
    this.router.navigate(['/Admin']);
  }

  navigateToViewProfile(ID: number) {
    this.router.navigate(['/ViewProfile/' + ID]);
  }

  navigateToLogin() {
    localStorage.clear();
    this.router.navigate(['/login']);
    this.clearData();
  }

  clearData() {
    this.shareData.userData = undefined;
  }

  sanitizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  navigateTop() {
    this.router.navigate(['/top10']);
  }

  Change(time: any) {
    const Time = parseInt(time);
    const result = this.api.updateTime(Time);
    alert('update time success');
  }

  getImageCount(userID: number): number {
    const userImgCount = this.imgCount.find((item) => item.userID === userID);
    return userImgCount ? userImgCount.image_count : 0;
  }
}
