import {Injectable} from '@angular/core';
import {FormGroup, AbstractControl, ValidatorFn} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  getErrorMessage(control: AbstractControl, field: string, select: boolean): string {
    if (control.invalid && (control.dirty || control.touched)) {
      switch (true) {
        case control.hasError('required'):
          return select ? `${field} चुनना अनिवार्य है` : `${field} भरना अनिवार्य है`;
        case control.hasError('pattern'):
          return `${field} का प्रारूप सही नहीं है`;
        case control.hasError('minlength'):
          return `${field} न्यूनतम सीमा से कम है`;
        case control.hasError('maxlength'):
          return `${field} अधिकतम सीमा से ज्यादा है`;
        case control.hasError('invalidAadhar'):
          return `${field} गलत है`;
        default:
          return '';
      }
    } else {
      return ''
    }
  }

  MatchingValidator(controlName: string, matchingControlName: string): any {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl: any = formGroup.controls[matchingControlName];
      if (matchingControl.errors && !matchingControl.errors.confirmedValidator) return;
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({confirmedValidator: true});
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  addValidators(form: FormGroup, fieldName: string, validators: ValidatorFn | ValidatorFn[]): void {
    const control = form.get(fieldName);
    if (control) {
      control.setValidators(validators);
      control.updateValueAndValidity();
    } else {
      console.error(`Control with name ${fieldName} not found in the form group.`);
    }
  }

  // Method to remove validators from a form control
  removeValidators(form: FormGroup, fieldName: string): void {
    const control = form.get(fieldName);
    if (control) {
      control.clearValidators();
      control.updateValueAndValidity();
    } else {
      console.error(`Control with name ${fieldName} not found in the form group.`);
    }
  }

  // Method to reset a form control's value
  resetControlValue(form: FormGroup, fieldName: string | string[], value: any = null): void {
    if (Array.isArray(fieldName)) {
      fieldName.forEach(name => this.resetSingleControl(form, name, value));
    } else {
      this.resetSingleControl(form, fieldName, value);
    }
  }

  // Helper method to reset a single form control
  private resetSingleControl(form: FormGroup, fieldName: string, value: any): void {
    const control = form.get(fieldName);
    if (control) {
      control.reset(value);
    } else {
      console.error(`Control with name ${fieldName} not found in the form group.`);
    }
  }

  private disableSingleControl(form: FormGroup, fieldName: string): void {
    const control = form.get(fieldName);
    if (control) {
      control.disable();
    } else {
      console.error(`Control with name ${fieldName} not found in the form group.`);
    }
  }

  disableControl(form: FormGroup, fieldName: string | string[]): void {
    if (Array.isArray(fieldName)) {
      fieldName.forEach(name => this.disableSingleControl(form, name));
    } else {
      this.disableSingleControl(form, fieldName);
    }
  }
}
