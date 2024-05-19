var express = require("express");
const app = express();
const cors = require("cors");

const corsOptions = {
  origin: "https://lazyshoppers.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));


require("dotenv").config();

const userRoutes = require("./routes/users/usersRoutes");
const productRoutes = require("./routes/products/productRoutes");
const emailrouter = require("./routes/emailRoutes/emailRoutes");

// app.use((req, res, next) => {
//   console.log("before", req);
//   next();test
// });

app.use(express.json());

//DB Connection
const dbconnection = require("./config/DBconnection");
dbconnection();

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/email", emailrouter);

app.get("/", (req, res) => {
  res.send("Namstea, Welcome!");
});

//404 page
app.use((req, res) => {
  res
    .status(404)
    .send(
      '<center><h1 style="margin:10%">4️⃣0️⃣4️⃣ - Not Found   <br>  ¯\\_(ツ)_/¯ </h1></center>'
    );
});

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `🟢 server started listening ${process.env.PORT ? process.env.PORT : 3000}`
  );
});
