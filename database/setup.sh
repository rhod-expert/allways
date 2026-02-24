#!/bin/bash
# Allways Show de Premios - Database Setup Script
source /etc/profile.d/oracle.sh
sqlplus allways/Q1Kpvif9RTs4@WINT @/var/www/html/allways/database/run-all.sql
