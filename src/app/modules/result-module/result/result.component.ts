import { Component, OnInit, inject, PLATFORM_ID, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AssetsModel } from '../../../models/asset.model';
import { StageModel } from '../../../models/stage.model';
import * as Highcharts from 'highcharts';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrl: './result.component.css',
})
export class ResultComponent implements OnInit {
  private store = inject(Store);

  assets!: AssetsModel;
  stages: StageModel[] = [];

  Highcharts: typeof Highcharts = Highcharts;
  chartConstructor: string = 'chart';
  chartOptions: Highcharts.Options = {};

  financialFreedomPoint: any[] = [];
  resultsForm: any;

  isServer = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.store.select('assets').subscribe((assets) => {
      this.assets = assets;
    });

    this.store.select('stages').subscribe((stages) => {
      this.stages = stages;
    });

    this.isServer = !isPlatformBrowser(platformId);

    this.chartOptions = {
      plotOptions: {
        line: {
          pointStart: this.assets.begin,
        },
      },
      accessibility: {
        enabled: false,
      },
      title: {
        text: 'Financial Freedom Point Chart',
      },
      xAxis: {
        title: {
          text: 'Age',
        },
      },
      yAxis: {
        title: {
          text: 'Money',
        },
      },
      series: [
        {
          name: 'Saving Capital',
          data: this.calculateSavingPoints(),
          type: 'line',
        },
        {
          name: 'Consumner Capital',
          data: this.calculateSpendingPoints(),
          type: 'line',
        },

        {
          name: 'intersect',
          data: [],
          type: 'scatter',
        },
      ],
    };
  }

  ngOnInit(): void {
    const point = this.calculateFFPoint(
      this.calculateSavingPoints(),
      this.calculateSpendingPoints()
    );
    this.resultsForm = this.formBuilder.group({
      freedomPointX: point[0][0].toFixed(3),
      freedomPointY: point[0][1].toFixed(3),
    });
  }

  onBackButtonClick(): void {
    this.router.navigate(['/stages']);
  }

  calculateSavingPoints(): number[] {
    const points: number[] = [];
    const assetsValue = this.calculateAssets(this.assets);
    let savingPreviousStage = assetsValue;

    this.stages.forEach((stage) => {
      for (let i = 1; i < stage.stageLength + 1; i++) {
        points.push(
          savingPreviousStage +
            (stage.revenueModel.calculate() - stage.expensesModel.calculate()) *
              i
        );

        if (i === stage.stageLength) {
          savingPreviousStage = points[points.length - 1];
        }
      }
    });

    points.push(
      savingPreviousStage +
        this.stages[this.stages.length - 1].revenueModel.calculate()
    );

    return points;
  }

  calculateSpendingPoints(): number[] {
    let points: number[] = [];
    let prevStageLength = 0;
    let prevStep = 0;

    points.push(0);

    for (let j = this.stages.length - 1; j >= 0; j--) {
      for (let i = 1; i < this.stages[j].stageLength + 1; i++) {
        let value =
          prevStep +
          this.stages[j].expensesModel.calculate() *
            Math.pow(
              1 + this.assets.expectedInflation / 100,
              this.assets.planLength - (i + prevStageLength) + 1
            );
        points.push(value);

        prevStep = value;
      }
      prevStageLength += this.stages[j].stageLength;
    }

    points = points.reverse();

    return points;
  }

  get_line_intersection(p0: any, p1: any, p2: any, p3: any) {
    var p0_x = p0.x;
    var p0_y = p0.y;
    var p1_x = p1.x;
    var p1_y = p1.y;
    var p2_x = p2.x;
    var p2_y = p2.y;
    var p3_x = p3.x;
    var p3_y = p3.y;

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s =
      (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) /
      (-s2_x * s1_y + s1_x * s2_y);
    var t =
      (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) /
      (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return [p0_x + t * s1_x, p0_y + t * s1_y];
    }

    return null;
  }

  onChartInstance(chart: Highcharts.Chart): void {
    if (chart) {
      var s0 = chart.series[0].data;
      var s1 = chart.series[1].data;

      var s2 = chart.series[2];
      var n0 = s0!.length;
      var n1 = s1!.length;
      var i, j, isect;

      for (i = 1; i < n0; i++) {
        for (j = 1; j < n1; j++) {
          if (
            (isect = this.get_line_intersection(
              s0[i - 1],
              s0[i],
              s1[j - 1],
              s1[j]
            ))
          ) {
            s2.addPoint(isect, false, false);
            this.financialFreedomPoint.push(isect);
          }
        }
      }
      chart.redraw();
    }
  }

  calculateFFPoint(s0: number[], s1: number[]): any {
    const ageArray: number[] = [];

    for (let age = this.assets.begin; age <= this.assets.end; age++) {
      ageArray.push(age);
    }

    const combinedArrayS0: { x: number; y: number }[] = ageArray.map(
      (x, index) => ({
        x,
        y: s0[index],
      })
    );

    const combinedArrayS1: { x: number; y: number }[] = ageArray.map(
      (x, index) => ({
        x,
        y: s1[index],
      })
    );

    var s2: number[][] = [];
    var n0 = s0!.length;
    var n1 = s1!.length;
    var i, j, isect;

    for (i = 1; i < n0; i++) {
      for (j = 1; j < n1; j++) {
        if (
          (isect = this.get_line_intersection(
            combinedArrayS0[i - 1],
            combinedArrayS0[i],
            combinedArrayS1[j - 1],
            combinedArrayS1[j]
          ))
        ) {
          s2.push(isect);
        }
      }
    }

    return s2;
  }

  calculateAssets(assetsToCalculate: AssetsModel): number {
    let result = 0;

    result +=
      assetsToCalculate.cash +
      assetsToCalculate.bond +
      assetsToCalculate.preciousMetal +
      assetsToCalculate.stock +
      assetsToCalculate.otherAssets;

    result +=
      assetsToCalculate.propertyValue + assetsToCalculate.otherRealEstate;

    result -= assetsToCalculate.liablityValue + assetsToCalculate.provision;
    return result;
  }

  calculateAssetsIREachYear(assetsToCalculate: AssetsModel): number {
    let result = 0;

    result +=
      (assetsToCalculate.propertyValue + assetsToCalculate.otherRealEstate) *
      assetsToCalculate.propertyValueIR;

    result -=
      assetsToCalculate.liablityValue * assetsToCalculate.liabilityValueIR;
    return result;
  }
}
