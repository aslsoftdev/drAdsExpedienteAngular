import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit {
  visible = true;

  ngOnInit(): void {
    // ⏳ Splash desaparece en 1.5 segundos
    setTimeout(() => {
      this.visible = false;
    }, 1500);
  }
}
