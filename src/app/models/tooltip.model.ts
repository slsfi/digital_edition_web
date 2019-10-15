export class Tooltip {
  public id: string;
  public name: string;
  public description: string;

  constructor(tooltipInfo: any) {
    this.id = tooltipInfo.id;
    this.name = tooltipInfo.name;
    this.description = tooltipInfo.description;
  }
}
