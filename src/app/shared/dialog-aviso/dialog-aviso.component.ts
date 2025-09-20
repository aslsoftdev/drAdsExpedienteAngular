import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface DialogAvisoData {
  titulo: string;
  mensaje: string;
  textoCerrar?: string;
}

@Component({
  selector: 'app-dialog-aviso',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './dialog-aviso.component.html',
  styleUrls: ['./dialog-aviso.component.scss']
})
export class DialogAvisoComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogAvisoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogAvisoData
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}
