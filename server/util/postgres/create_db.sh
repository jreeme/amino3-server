#!/usr/bin/env bash

psql --username=postgres -c "create database amino_admin;"
#psql --username=postgres amino_admin < amino_admin.sql

psql --username=postgres template1 -c "create user amino_admin_user;"
psql --username=postgres template1 -c "alter user amino_admin_user password 'password';"
psql --username=postgres template1 -c "grant all on database amino_admin to amino_admin_user;"
psql --username=postgres amino_admin -c "grant all on all tables in schema public to amino_admin_user;"
