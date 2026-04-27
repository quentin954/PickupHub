# PickupHub
> Application for tracking and managing packages from delivery platforms

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22-339939?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com)

## Overview

PickupHub is an application for tracking and managing packages from delivery platforms (Vinted, Vinted Go, Chronopost, Mondial Relay). Users can link their platform and email accounts to automatically sync package tracking information.

## Features

- User authentication with JWT
- Platform account linking (OAuth)
- Email account linking (OAuth & IMAP)
- Automatic package synchronization from email parsing
- Package tracking management with retrieval codes and QR codes
- Support for multiple carriers

## Tech Stack

- **Frontend**: React 19
- **Backend**: Node.js 22, Express.js
- **Database**: PostgreSQL 18
- **ORM**: Prisma