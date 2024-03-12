import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api-service';
import { ShareService } from '../../../services/share.service';
import { MatIconModule } from '@angular/material/icon';
import { User, imageUpload } from '../../../model/model';

@Component({
  selector: 'app-top10',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,MatIconModule
  ],
  templateUrl: './top10.component.html',
  styleUrl: './top10.component.scss',
})
export class Top10Component implements OnInit {
  constructor(
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router
  ) {}
  // imageUrls: string[] = [
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  //   '/assets/Image/castle-3175321_960_720.jpg',
  // ];
  imageUrls : imageUpload[] = [];
  id: any;
  userData : User | undefined;
  userUrls : User[] = [];
  async ngOnInit() {
    this.getTopImageData();
    const userDataString = localStorage.getItem("userData");
    this.userData = userDataString ? JSON.parse(userDataString) : undefined;
    this.id = localStorage.getItem('userID');
    this.loadData();
  }

  async getTopImageData(){
    this.imageUrls = await this.api.getTopImage();  
  }

 
  async loadData() {
    this.shareData.userData = await this.api.getUserbyId(this.id);
    localStorage.setItem('userData', JSON.stringify(this.shareData.userData));
    console.log(this.shareData.userData);
  }

  navigateTop() {
    this.router.navigate(['/top10']);
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
  navigateTomain() {
    this.router.navigate(['/']);
  }

  navigateProfile() {
    this.router.navigate(['/profile']);
  }

  clearData() {
    this.shareData.userData = undefined;
  }
}