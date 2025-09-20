import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './dialog-loader.component.html',
  styleUrls: ['./dialog-loader.component.scss']
})
export class DialogLoaderComponent {
  constructor(public dialogRef: MatDialogRef<DialogLoaderComponent>) {}
}
