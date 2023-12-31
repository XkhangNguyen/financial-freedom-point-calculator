import { StageModel } from '../../../models/stage.model';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { ExpensesModel } from '../../../models/stage-expense.model';
import { RevenueModel } from '../../../models/stage-revenue.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import * as Highcharts from 'highcharts';

import {
  addStage,
  deleteStage,
  editStage,
} from '../../../services/data-transfer/actions/stages.actions';

import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { AssetsModel } from '../../../models/asset.model';
@Component({
  selector: 'app-stage-of-life',
  templateUrl: './stage-of-life.component.html',
  styleUrls: ['./stage-of-life.component.css'],
})
export class StageOfLifeComponent implements OnInit {
  private store = inject(Store);
  stageInfoForm: any;
  revenueForm: any;
  expenseForm: any;
  isEdit = false;
  editIndex: number = 0;

  isFormOn = false;

  assets!: AssetsModel;
  stages: StageModel[] = [];

  faEdit = faEdit;
  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;
  revenueDetailsVisibility: { [key: string]: boolean } = {};
  expenseDetailsVisibility: { [key: string]: boolean } = {};

  toggleRevenueDetails(stage: StageModel): void {
    const stageId = stage.name;
    this.revenueDetailsVisibility[stageId] =
      !this.revenueDetailsVisibility[stageId];
  }

  toggleExpenseDetails(stage: StageModel): void {
    const stageId = stage.name;
    this.expenseDetailsVisibility[stageId] =
      !this.expenseDetailsVisibility[stageId];
  }

  fixedFromAge!: number;

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.store.select('stages').subscribe((stages) => {
      this.stages = stages;
    });

    this.store.select('assets').subscribe((assets) => {
      this.assets = assets;
    });

    if (this.stages.length === 0) {
      this.fixedFromAge = this.assets.begin;
    } else {
      this.fixedFromAge = this.stages[this.stages.length - 1].toAge;
    }
  }

  ngOnInit(): void {
    for (let i = 0; i < this.stages.length; i++) {
      this.addColumnChart(i);
    }
  }

  checkStagesLength(): boolean {
    let sumLength = 0;
    for (let i = 0; i < this.stages.length; i++) {
      sumLength += this.stages[i].stageLength;
    }

    if (sumLength !== this.assets.planLength) {
      return false;
    }

    return true;
  }

  onBackButtonClick(): void {
    this.router.navigate(['/']);
  }

  onNextButtonClick(): void {
    if (this.fixedFromAge !== this.assets.end || !this.checkStagesLength()) {
      this.showInvalidInputSnackBar(
        "Please add enough stages to cover the plan's length."
      );
      return;
    }
    this.router.navigate(['/result']);
  }

  clearControlValue(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    if (control!.value === 0) {
      control!.setValue(null);
    }
  }

  displayZero(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    if (control!.value === null) {
      control!.setValue(0);
    }
  }

  nonZeroValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return value !== 0 ? null : { nonZero: true };
  }

  checkDuplicatedName() {
    const isNameDuplicate = this.stages.some(
      (existingStage) =>
        existingStage.name.toLowerCase() ===
        this.stageInfoForm.get('name')!.value.toLowerCase()
    );

    return isNameDuplicate;
  }

  checkDuplicatedNameOnEdit(name: string): boolean {
    const omitStages = this.stages.filter(
      (existingStage) => existingStage.name != name
    );

    const isNameDuplicate = omitStages.some(
      (existingStage) =>
        existingStage.name.toLowerCase() ===
        this.stageInfoForm.get('name')!.value.toLowerCase()
    );

    return isNameDuplicate;
  }

  showInvalidInputSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  addStageForm() {
    this.isFormOn = true;

    this.revenueForm = this.formBuilder.group({
      netSalary: 0,
      capitalAssets: 0,
      passiveIncome: 0,
      occasionalIncome: 0,
      otherIncome: 0,
      dependents: 0,
    });

    (this.expenseForm = this.formBuilder.group({
      livingCostPerMonth: 0,
      dependents: 0,
      purchaseFund: 0,
      occasionalCost: 0,
      maintenanceCost: 0,
      interestAndRepayment: 0,
      otherExpenses: 0,
    })),
      (this.stageInfoForm = this.formBuilder.group({
        name: ['', Validators.required],
        description: [null, Validators.required],
        fromAge: [this.fixedFromAge, Validators.required],
        toAge: [0, [Validators.required, this.nonZeroValidator]],
        revenue: this.revenueForm,
        expense: this.expenseForm,
      }));
  }

  editStageForm(stageData: StageModel) {
    this.isEdit = true;
    this.isFormOn = true;
    this.editIndex = this.stages.findIndex((existingStage) => {
      return existingStage.name === stageData.name;
    });

    this.revenueForm = this.formBuilder.group({
      netSalary: stageData.revenueModel.netSalary,
      capitalAssets: stageData.revenueModel.capitalAssets,
      passiveIncome: stageData.revenueModel.passiveIncome,
      occasionalIncome: stageData.revenueModel.occasionalIncome,
      dependents: stageData.revenueModel.dependents,
      otherIncome: stageData.revenueModel.otherIncome,
    });

    (this.expenseForm = this.formBuilder.group({
      livingCostPerMonth: stageData.expensesModel.livingCostPerMonth,
      dependents: stageData.expensesModel.dependents,
      purchaseFund: stageData.expensesModel.purchaseFund,
      occasionalCost: stageData.expensesModel.occasionalCost,
      maintenanceCost: stageData.expensesModel.maintenanceCost,
      interestAndRepayment: stageData.expensesModel.interestAndRepayment,
      otherExpenses: stageData.expensesModel.otherExpenses,
    })),
      (this.stageInfoForm = this.formBuilder.group({
        name: [stageData.name, Validators.required],
        description: [stageData.description, Validators.required],
        fromAge: [stageData.fromAge, [Validators.required]],
        toAge: [stageData.toAge, [Validators.required, this.nonZeroValidator]],
        revenue: this.revenueForm,
        expense: this.expenseForm,
      }));
  }

  closeForm() {
    this.isFormOn = false;
    this.stageInfoForm.reset();
  }

  onSubmit() {
    if (!this.isEdit && this.checkDuplicatedName()) {
      this.showInvalidInputSnackBar(
        'This name is already used. Choose another name.'
      );
      return;
    } else if (
      this.isEdit &&
      this.checkDuplicatedNameOnEdit(this.stageInfoForm.value.name)
    ) {
      this.showInvalidInputSnackBar(
        'This name is already used. Choose another name.'
      );
      return;
    }

    const missingFields: string[] = [];

    if (!this.stageInfoForm.get('name')!.value) {
      missingFields.push("Stage's name");
    }

    if (!this.stageInfoForm.get('description')!.value) {
      missingFields.push('Description');
    }

    if (!this.stageInfoForm.get('fromAge')!.value) {
      missingFields.push('From age');
    }

    if (!this.stageInfoForm.get('toAge')!.value) {
      missingFields.push('To age');
    }

    if (this.stageInfoForm.valid) {
      const name = this.stageInfoForm.value.name!;
      const description = this.stageInfoForm.value.description!;
      const fromAge: number = this.stageInfoForm.value.fromAge!;
      const toAge: number = this.stageInfoForm.value.toAge!;
      const stageLength: number = toAge - fromAge;

      if (stageLength <= 0) {
        this.showInvalidInputSnackBar(
          'Please choose "To age" larger than "From age"'
        );
        return;
      }

      const revenueModel = new RevenueModel({
        netSalary: this.stageInfoForm.value.revenue?.netSalary!,
        capitalAssets: this.stageInfoForm.value.revenue?.capitalAssets!,
        occasionalIncome: this.stageInfoForm.value.revenue?.occasionalIncome!,
        passiveIncome: this.stageInfoForm.value.revenue?.passiveIncome!,
        otherIncome: this.stageInfoForm.value.revenue?.otherIncome!,
        dependents: this.stageInfoForm.value.revenue?.dependents!,
      });

      const expensesModel = new ExpensesModel({
        livingCostPerMonth:
          this.stageInfoForm.value.expense?.livingCostPerMonth!,
        dependents: this.stageInfoForm.value.expense?.dependents!,
        interestAndRepayment:
          this.stageInfoForm.value.expense?.interestAndRepayment!,
        maintenanceCost: this.stageInfoForm.value.expense?.maintenanceCost!,
        occasionalCost: this.stageInfoForm.value.expense?.occasionalCost!,
        purchaseFund: this.stageInfoForm.value.expense?.purchaseFund!,
        otherExpenses: this.stageInfoForm.value.expense?.otherExpenses!,
      });

      const expenses = expensesModel.calculate();
      const revenue = revenueModel.calculate();

      const stageOfLife = revenue - expenses;

      const stageToProcess = new StageModel({
        name,
        description,
        fromAge,
        toAge,
        stageLength,
        revenueModel,
        expensesModel,
        stageOfLife,
      });

      if (this.isEdit) {
        this.store.dispatch(
          editStage({ stage: stageToProcess, editIndex: this.editIndex })
        );
      } else {
        this.store.dispatch(addStage(stageToProcess));
      }
      this.fixedFromAge = stageToProcess.toAge;

      this.isEdit = false;

      this.closeForm();

      this.addColumnChart(this.stages.length - 1);
    } else {
      const message = `Please fill in the following required fields: ${missingFields.join(
        ', '
      )}`;

      this.showInvalidInputSnackBar(message);
    }
  }

  onDeleteButtonClick() {
    this.fixedFromAge = this.assets.begin;

    this.store.dispatch(deleteStage());
  }

  addColumnChart(index: number) {
    const containerId = 'chart-container-' + index;
    const chartOptions: Highcharts.Options = {
      chart: {
        type: 'column',
      },
      accessibility: {
        enabled: false,
      },
      title: {
        text: this.stages[index].name + ' Chart',
      },
      xAxis: {
        categories: ['Income', 'Expense', 'Earning'],
        title: {
          text: 'Income-Expense',
        },
      },
      yAxis: {
        title: {
          text: 'Total Value',
        },
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{point.y}',
      },
      legend: { enabled: false },
      series: [
        {
          type: 'column',
          data: [
            {
              y: this.stages[index].revenueModel.calculate(),
              color: '#55BF3B',
            },
            {
              y: this.stages[index].expensesModel.calculate(),
              color: '#DF5353',
            },
            {
              y: this.stages[index].stageOfLife,
              color: '#7798BF',
            },
          ],
        },
      ],
    };

    setTimeout(() => {
      Highcharts.chart(containerId, chartOptions);
    });
  }
}
