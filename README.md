# invoice-generator-internship
A client-side invoice generator built with HTML, CSS &amp; JavaScript and deployed as a static website using Amazon S3.
## ☁️ AWS Deployment

The Invoice Generator was deployed as a static website using
Amazon S3 (Simple Storage Service).

## Features

- Create invoices
- Add/remove invoice items
- Automatic subtotal calculation
- Discount and tax calculation
- Invoice preview
- Mark invoices as paid
- Search and filter invoice history
- Edit and delete saved invoices
- Print / Save invoices as PDF
- Browser-based invoice storage using localStorage

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Amazon S3
- Browser localStorage

## Project Architecture

The application consists of three main pages:

- `index.html` — Create and edit invoices
- `preview.html` — Preview and print invoices
- `history.html` — Manage saved invoices

Invoice data is stored locally in the browser using `localStorage`,
so the project does not require a traditional backend or database.

### AWS Services Used

- Amazon S3 — Static website hosting
- S3 Bucket — Stores HTML, CSS, JavaScript and other static assets

### Deployment Process

1. Created an Amazon S3 bucket.
2. Uploaded the Invoice Generator project files.
3. Configured the bucket for public access.
4. Enabled static website hosting.
5. Set `index.html` as the index document.
6. Accessed the application through the S3 website endpoint.

### Architecture

User -> Web Browser -> Amazon S3 -> HTML / CSS / JavaScript -> Browser localStorage
