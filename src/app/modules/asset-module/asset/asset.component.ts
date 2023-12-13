import { Component, OnInit, inject } from '@angular/core';
import { AssetsModel } from '../../../models/asset.model';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { setAssets } from '../../../services/data-transfer/actions/assets.actions';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.css',
})
export class AssetComponent implements OnInit {
  private store = inject(Store);

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.store.select('assets').subscribe((assets) => {
      this.assets = assets;
    });
  }

  assets!: AssetsModel;
  assetsForm: any;

  clearControlValue(controlName: string) {
    const control = this.assetsForm.get(controlName);
    if (control.value === 0) {
      control.setValue(null);
    }
  }

  displayZero(controlName: string) {
    const control = this.assetsForm.get(controlName);
    if (control.value === null) {
      control.setValue(0);
    }
  }

  nonZeroValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return value !== 0 ? null : { nonZero: true };
  }

  ngOnInit(): void {
    this.assetsForm = this.formBuilder.group({
      begin: [this.assets.begin, [Validators.required, this.nonZeroValidator]],
      end: [this.assets.end, [Validators.required, this.nonZeroValidator]],
      cash: this.assets.cash,
      stock: this.assets.stock,
      bond: this.assets.bond,
      preciousMetal: this.assets.preciousMetal,
      otherAssets: this.assets.otherAssets,
      propertyValue: this.assets.propertyValue,
      propertyValueIR: this.assets.propertyValueIR,
      otherRealEstate: this.assets.otherRealEstate,
      liablityValue: this.assets.liablityValue,
      liabilityValueIR: this.assets.liabilityValueIR,
      provision: this.assets.provision,
    });
  }

  submitForm() {
    const missingFields: string[] = [];

    if (
      !this.assetsForm.get('begin')!.value ||
      this.assetsForm.get('begin')!.value === 0
    ) {
      missingFields.push('Begin of the Plan');
    }

    if (
      !this.assetsForm.get('end')!.value ||
      this.assetsForm.get('end')!.value === 0
    ) {
      missingFields.push('End of the Plan');
    }

    if (this.assetsForm.valid) {
      const {
        begin,
        end,
        cash,
        stock,
        bond,
        preciousMetal,
        otherAssets,
        propertyValue,
        propertyValueIR,
        otherRealEstate,
        liablityValue,
        liabilityValueIR,
        provision,
      } = this.assetsForm.value;

      const planLength = end! - begin!;

      const assetsModel: AssetsModel = {
        begin: begin || 0,
        end: end || 0,
        planLength,
        cash: cash || 0,
        stock: stock || 0,
        bond: bond || 0,
        preciousMetal: preciousMetal || 0,
        otherAssets: otherAssets || 0,
        propertyValue: propertyValue || 0,
        propertyValueIR: propertyValueIR || 0,
        otherRealEstate: otherRealEstate || 0,
        liablityValue: liablityValue || 0,
        liabilityValueIR: liabilityValueIR || 0,
        provision: provision || 0,
      };

      this.store.dispatch(setAssets({ assets: assetsModel }));

      this.router.navigate(['/stages']);
    } else {
      const message = `Please fill in the following required fields: ${missingFields.join(
        ', '
      )}`;

      const config: MatSnackBarConfig = {
        verticalPosition: 'top',
        horizontalPosition: 'center',
        duration: 3000,
      };
      this.snackBar.open(message, 'Close', config);
    }
  }
}
