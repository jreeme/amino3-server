import {BaseDatabaseHelper} from "./base-database-helper";

export interface PostgresSettings {
  host: string,
  port: number,
  database: string,
  name: string,
  admin_user: string,
  admin_password: string,
  user: string,
  password: string,
  connector: string
}

export interface PostgresHelper extends BaseDatabaseHelper{
}

/*
#!/usr/bin/env bash

psql --username=postgres -c "create database amino_admin;"
#psql --username=postgres amino_admin < amino_admin.sql

psql --username=postgres template1 -c "create user amino_admin_user;"
psql --username=postgres template1 -c "alter user amino_admin_user password 'password';"
psql --username=postgres template1 -c "grant all on database amino_admin to amino_admin_user;"
psql --username=postgres amino_admin -c "grant all on all tables in schema public to amino_admin_user;"
*/
