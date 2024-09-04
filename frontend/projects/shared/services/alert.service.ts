import {Injectable} from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() {
  }

  alert(data: any, title: any = ''): void {
    const type = data.success ? 'success' : 'error';
    Swal.fire({
      title: title,
      text: data.message,
      icon: type,
      showConfirmButton: false,
      timer: 1500
    })
  }

  alertSuccess(status: any, title: any = '', message = ''): void {
    const type = status !== 400 ? 'success' : 'error';
    Swal.fire({
      title: title,
      text: message,
      icon: type,
      showConfirmButton: false,
      timer: 1500
    })
  }

  alertMessage(title: string, html: string, icons: any, confirmButtonText = "OK"): any {
    return Swal.fire({
      title: `<b>${title}</b>`,
      html: html,
      icon: icons,
      showConfirmButton: true,
      confirmButtonText: confirmButtonText,
      allowOutsideClick: false,
      allowEscapeKey: false,
      // timer: 2000,
      // timerProgressBar: true
    })
  }

  confirmAlert(title: any, html: any, icons: any): any {
    return Swal.fire({
      title: `<b>${title}</b>`,
      text: html,
      icon: icons,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'हां',
      cancelButtonText: 'नहीं',
      backdrop: false,
    })
  }

  remarkAlert(title: any): any {
    return Swal.fire({
      title: `<b>${title}</b>`,
      input: 'text',
      icon: 'question',
      inputAttributes: {
        required: 'required',
        placeholder: 'टिप्पणी लिखें',
        class: 'form-control'
      },
      showCancelButton: true,
      confirmButtonText: 'हां',
      cancelButtonText: 'नहीं',
      showLoaderOnConfirm: true,
      preConfirm: (name) => {
        if (!name) {
          Swal.showValidationMessage('टिप्पणी लिखना अनिवार्य है |')
        }
        return name
      },
      allowOutsideClick: () => !Swal.isLoading()
    })
  }
}
