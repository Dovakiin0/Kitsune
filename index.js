const app = require("express")();

require("./routes/router")(app);

const PORT = 3030;

app.listen(PORT, console.log(`Listening on port ${PORT}`));
