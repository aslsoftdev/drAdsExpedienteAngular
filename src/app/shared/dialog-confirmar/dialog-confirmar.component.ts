import {
  Component,
  Inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import {
  MatButtonModule
} from '@angular/material/button';
import {
  MatIconModule
} from '@angular/material/icon';
import {
  CommonModule
} from '@angular/common';
export interface DialogConfirmarData {
  titulo: string;
  mensaje: string;
  textoConfirmar ? : string;
  textoCancelar ? : string;
}
@Component({
  selector: 'app-dialog-confirmar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './dialog-confirmar.component.html',
  styleUrls: ['./dialog-confirmar.component.scss']
}) export class DialogConfirmarComponent {
  constructor(public dialogRef: MatDialogRef < DialogConfirmarComponent > , @Inject(MAT_DIALOG_DATA) public data: DialogConfirmarData) {}
  cancelar(): void {
    this.dialogRef.close(false);
  }
  confirmar(): void {
    this.dialogRef.close(true);
  }
}
