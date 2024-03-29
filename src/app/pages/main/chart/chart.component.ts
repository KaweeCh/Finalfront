import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { Statistic, User, imageUpload } from '../../../model/model';
import { ApiService } from '../../../services/api-service';
import { ShareService } from '../../../services/share.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
})
export class ChartComponent {
  public chart: any;
  images: imageUpload[] = [];
  statistics: Statistic[] = [];
  httpError: boolean = false;
  userID: any;
  userData!: User;
  id: any;
  data: any;

  constructor(
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.checkLogin();
    const userDataString = localStorage.getItem('userData');
    this.userData = userDataString ? JSON.parse(userDataString) : null;
    this.id = this.route.snapshot.paramMap.get('id');
    await this.updateStatistics(); // เพิ่มการอัปเดตข้อมูลสถิติก่อนสร้างกราฟ
    this.createChart();
  }

  async updateStatistics() {
    this.statistics = await this.api.getStatistic(this.id, 7);
  }

  checkLogin() {
    if (!localStorage.getItem('userData') || !localStorage.getItem('userID')) {
      this.navigateToLogin();
    }
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

  clearData() {
    this.shareData.userData = undefined;
    this.shareData.chartData = undefined;
  }

  navigateProfile() {
    this.router.navigate(['/profile']);
  }

  navigateTop() {
    this.router.navigate(['/top10']);
  }

  createChart() {
    const currentDate = new Date();
    const labels = [];
    const data = [];
    const pointRadius = 5;
    for (let i = 6; i >= 0; i--) {
      const currentDateMinusDays = new Date(currentDate);
      currentDateMinusDays.setDate(currentDate.getDate() - i);

      labels.push(
        `${currentDateMinusDays.getFullYear()}-${(
          currentDateMinusDays.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}-${currentDateMinusDays
          .getDate()
          .toString()
          .padStart(2, '0')}`
      );
    }

    for (let i = 0; i < 7; i++) {
      const currentDateMinusDays = new Date(currentDate);
      currentDateMinusDays.setDate(currentDate.getDate() - i);

      const dataForCurrentDate = this.statistics.find((statistic) => {
        const statisticDate = new Date(statistic.date);
        return (
          currentDateMinusDays.getFullYear() === statisticDate.getFullYear() &&
          currentDateMinusDays.getMonth() === statisticDate.getMonth() &&
          currentDateMinusDays.getDate() === statisticDate.getDate()
        );
      });

      if (dataForCurrentDate) {
        data.push(dataForCurrentDate.voteScore);
      } else {
        // หากไม่มีข้อมูลสถิติสำหรับวันที่ปัจจุบันให้ใช้คะแนนของภาพใหม่ที่ถูกอัปโหลดขึ้นมา
        const uploadedImageScore = 1000; // ตั้งค่าคะแนนของภาพที่ถูกอัปโหลดใหม่
        data.push(uploadedImageScore);
      }
    }

    console.error('Labels:', labels);
    console.error('Data:', data);

    this.chart = new Chart('MyChart', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Score',
            data: Array.from(data).reverse(),
            backgroundColor: 'blue',
            pointStyle: 'circle',
            pointRadius: pointRadius,
          },
        ],
      },
      options: {
        aspectRatio: 0.6,
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}
