with open('index.js', 'r') as f:
    content = f.read()

content = content.replace('var song = require("./routes/song.route");', 'var song = require("./routes/song.route");\nvar appRoute = require("./routes/app.route");')
content = content.replace('app.use("/song", isAuth, song);', 'app.use("/song", isAuth, song);\napp.use("/app", appRoute); // Not auth required')

with open('index.js', 'w') as f:
    f.write(content)
