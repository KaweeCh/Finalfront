import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api-service';
import { ShareService } from '../../../services/share.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../model/model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, MatButtonModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginError: string = '';

  constructor(private router: Router, protected shareData: ShareService) {
    localStorage.clear();
    this.shareData.getUser();
    // console.log(this.shareData);
  }

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  navigateToMain() {
    this.router.navigate(['/']);
  }

  navigateToAdmin(id : number) {
    this.router.navigate(['/admin/' + id]);
  }

  login(user: string, password: string) {
    if (user.trim() === '' || password === '') {
      this.loginError = 'Please fill in both username and password.';
      return;
    }

    const foundUser = this.shareData.users.find(
      (userData) => user === userData.username || user === userData.email
    );

    if (foundUser) {
      if (password === foundUser.password) {
         localStorage.setItem('userID', JSON.stringify(foundUser.userID));
        // Check if the user is an owner or a regular user
        if (foundUser.type === 'owner') {
          this.navigateToAdmin(foundUser.userID);
          
        } else {
          this.navigateToMain();
        }
       
      } else {
        this.loginError = 'Incorrect password.';
      }
    } else {
      this.loginError = 'User not found.';
    }
  }
}