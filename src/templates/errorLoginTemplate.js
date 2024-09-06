const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 50px auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #f44336;
    }
    p {
      font-size: 18px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Error!</h1>
    <p>There was an error processing your token. Please try again later.</p>
  </div>
</body>
</html>
`

module.exports = errorHtml
