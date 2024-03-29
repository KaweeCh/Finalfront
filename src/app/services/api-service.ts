import { Injectable, OnInit } from '@angular/core';
import { Constant } from '../config/constaint';
import { HttpClient } from '@angular/common/http';
import { count, lastValueFrom } from 'rxjs';
import {
  ImageCount,
  ImageRandom,
  Register,
  Statistic,
  User,
  Vote,
  imageUpload,
  imageUser,
} from '../model/model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private url: string;

  constructor(private constant: Constant, private http: HttpClient) {
    this.url = this.constant.API_ENDPOINT;
  }

  public async updateTime(time: number) {
    let body = {
      time: time,
    };
    const response = await lastValueFrom(
      this.http.post(this.url + '/time', body)
    ); 

    return response;
   
  }

  public async getUser() {
    const response = await lastValueFrom(
      this.http.get<User[]>(`${this.url}/users`)
    );
    // console.log(response);
    return response;
  }

  public async getUserMember() {
    const response = await lastValueFrom(
      this.http.get<User[]>(`${this.url}/users/member`)
    );
    // console.log(response);
    return response;
  }

  public async updateUser(userId: number, body: Partial<User>) {
    const response = await lastValueFrom(
      this.http.put<User>(`${this.url}/users/update${userId}`, body)
    );
    return response;
  }

  public async getImage() {
    const response = await lastValueFrom(
      this.http.get<imageUser[]>(`${this.url}/images`)
    );
    return response;
  }

  public async getImageCount() {
    const response = await lastValueFrom(
      this.http.get<ImageCount[]>(`${this.url}/images/count`)
    );
    return response;
  }

  public async gettodayrank() {
    const response = await lastValueFrom(
      this.http.get<imageUser[]>(`${this.url}/top/today`) // เปลี่ยน URL ตามต้องการ
    );
    // console.log(response);
    return response;
  }

  public async getyesterdayrank() {
    const response = await lastValueFrom(
      this.http.get<imageUser[]>(`${this.url}/top/yesterday`) // เปลี่ยน URL ตามต้องการ
    );
    // console.log(response);

    return response;
  }

  public async uploadImage(file: File, userID: string): Promise<imageUpload> {
    const formData = new FormData();
    formData.append('filename', file, file.name);
    formData.append('userID', userID);

    try {
      const response = await lastValueFrom(
        this.http.post<imageUpload>(`${this.url}/upload/${userID}`, formData)
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error uploading image', error);
      throw error;
    }
  }

  public async updateProfileUser(
    file: File,
    userID: string
  ): Promise<imageUser> {
    const formData = new FormData();
    formData.append('image', file, file.name);
    formData.append('userID', userID);
    try {
      const response = await lastValueFrom(
        this.http.put<imageUser>(
          `${this.url}/upload/profile/${userID}`,
          formData
        )
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error updating user profile', error);
      throw error;
    }
  }

  async ChangeImage(imageID: number, file: File) {
    const formData = new FormData();
    formData.append('imageID', imageID.toString());
    formData.append('fileimage', file);
  
    try {
      const response = await lastValueFrom(
        this.http.put<imageUser>(`${this.url}/upload/changeImage/${imageID}`, formData)
      );
      console.log(response);
      return true;
    } catch (error) {
      throw error;
    }
  }
  

  public async getUserbyId(userId: number) {
    if (userId) {
      const response = await lastValueFrom(
        this.http.get(`${this.url}/users/${userId}`)
      );
      return response as User;
    } else {
      return;
    }
  }

  public async getImagebyId(imageID: number) {
    const response = await lastValueFrom(
      this.http.get(`${this.url}/images/${imageID}`)
    );
    return response as imageUpload;
  }

  public async getProfileUserImage(userId: number): Promise<imageUser> {
    try {
      const response = await lastValueFrom(
        this.http.get<imageUser>(`${this.url}/users/profile/${userId}`)
      );
      return response;
    } catch (error) {
      console.error('Error fetching profile image:', error);
      throw error;
    }
  }

  public async deleteImagebyId(imageID: number) {
    const response = await lastValueFrom(
      this.http.delete(`${this.url}/images/${imageID}`)
    );
    return response;
  }

  public async register(body: Register) {
    const requestBody = {
      username: body.username,
      password: body.password,
      email: body.email,
      type: 'user',
    };

    try {
      const response = await lastValueFrom(
        this.http.post<User[]>(`${this.url}/users`, requestBody)
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งข้อมูล', error);
      throw error;
    }
  }

  public async vote(body: Vote) {
    const requestBody = {
      userID: body.userID,
      imageID: body.imageID,
      elorating: body.elorating,
    };

    try {
      const response = await lastValueFrom(
        this.http.post<Vote>(`${this.url}/vote`, requestBody)
      );
      return response;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งข้อมูล', error);
      throw error;
    }
  }

  public updateScore(id: number, score: number) {
    let body = {
      count: score,
    };
    this.http.put(this.url + '/images/' + id, body).subscribe();
  }

  public async getStatistic(imageID: number, day: number) {
    try {
      const response = await lastValueFrom(
        this.http.get<Statistic[]>(`${this.url}/statistics/${imageID}/${day}`)
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  public async getStatisticbyId(imageID: number) {
    if (imageID) {
      const response = await lastValueFrom(
        this.http.get(`${this.url}/statistics/${imageID}`)
      );
      return response as Statistic;
    } else {
      return;
    }
  }

  public async userUpdate(userID: number, update: any) {
    console.log(update[0]);
    const response = await lastValueFrom(
      this.http.put(`${this.url}/users/${userID}`, update[0])
    );

    return response;
  }
  
  public async randomImage(userID : number){

    const response = await lastValueFrom(
      this.http.get<ImageRandom[]>(`${this.url}/images/random/${userID}`)
     
    );
   
    return response;
  }
}