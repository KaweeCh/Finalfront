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
  lastestData: Statistic | undefined;
  lastDay : any;
  httpError: boolean = false;
  userID: any;
  temp : any
  userData!: User;
  id: any;
  data: any;

  constructor(
    private route: ActivatedRoute,
    protected shareData: ShareService,
    protected api: ApiService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.checkLogin();
    const userDataString = localStorage.getItem('userData');
    this.userData = userDataString ? JSON.parse(userDataString) : null;
    this.id = this.route.snapshot.paramMap.get('id');
    this.statistics = await this.api.getStatistic(this.id, 7);
  
    this.createChart();
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

  // createChart() {
  //   const date = new Date();
  //   const year = date.getFullYear();
  //   const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
  //   const day = date.getDate().toString().padStart(2, '0');
  //   this.chart = new Chart("MyChart", {
  //     type: 'line',
  //     data: {
  //       labels: [`${year}-${month}-${day}`, `${year}-${month}-${day}`, '2022-05-12', '2022-05-13',
  //         '2022-05-15', '2022-05-16', '2022-05-17',],
  //       datasets: [
  //         {
  //           label: "Score",
  //           data: ['467', '576', '572', '79', '92',
  //             '574', '573', '576'],
  //           backgroundColor: 'blue'
  //         },
  //       ]
  //     },
  //     options: {
  //       aspectRatio: 0.6,
  //       responsive: true,
  //       maintainAspectRatio: false,
  //     },

  //   });
  // }

  async createChart() {
    const currentDate = new Date();
    const labels = [];
    const data = [];
    const point : any = await this.api.getStatisticbyId(this.id);
    const pointRadius = 5;
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
  
      labels.push(
        `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
      );
    }
  
    for (let i = 0; i < 7; i++) {
      const currentDateMinusDays = new Date(currentDate);
      currentDateMinusDays.setDate(currentDate.getDate() - i);
  
      console.log('Index:', i); // เพิ่มบรรทัดนี้เพื่อทำการล็อกค่า index
      console.log('Current Date:', currentDateMinusDays); // ล็อกค่าวันที่ปัจจุบันที่ใช้ในการตรวจสอบ
  
      // Check if there is data for the current date
      const dataForCurrentDate = this.statistics.find((statistic) => {
        const statisticDate = new Date(statistic.date); // Assuming 'date' is the property in your Statistic model that contains the date
        return (
          currentDateMinusDays.getFullYear() === statisticDate.getFullYear() &&
          currentDateMinusDays.getMonth() === statisticDate.getMonth() &&
          currentDateMinusDays.getDate() === statisticDate.getDate()
        );
      });
  
      console.log('Data for Current Date:', dataForCurrentDate); // ล็อกข้อมูลสถิติสำหรับวันที่ปัจจุบัน
  
      if (dataForCurrentDate) {
        data.push(dataForCurrentDate.voteScore);
      } else {
        // If no data for the current date, fetch data from the previous day
        const previousDate = new Date(currentDateMinusDays);
        previousDate.setDate(currentDateMinusDays.getDate() - 1);
        const dataFromPreviousDate = this.statistics.find((statistic) => {
          const statisticDate = new Date(statistic.date);
          return (
            previousDate.getFullYear() === statisticDate.getFullYear() &&
            previousDate.getMonth() === statisticDate.getMonth() &&
            previousDate.getDate() === statisticDate.getDate()
          );
        });
        if (dataFromPreviousDate) {
          data.push(dataFromPreviousDate.voteScore);
        } else {
          data.push(point[0].voteScore);
        }
      }
    }
  
    console.error(data);
  
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
