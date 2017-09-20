export interface BaseDatabaseHelper {
  connectorName:string;
  configure(dataSource: any, cb: (err:Error) => void);
}

