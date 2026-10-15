const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);

let users;
let projects;
let projectMemberships;

async function startServer() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("pa2");

        users = db.collection("users");
        projects = db.collection("projects");
        projectMemberships = db.collection("projectMemberships");

        app.listen(9000, () => {
            console.log("Server running on port 9000");
        });
    } catch (error) {
        console.error("MongoDB connection failed");
        console.error(error);
    }
}

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.get("/users", async (req, res) => {
    try {
        const allUsers = await users.find({}, {
            projection: { password: 0 }
        }).toArray();

        res.json(allUsers);
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    try {
        const existingUser = await users.findOne({
            username: username
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        await users.insertOne({
            username: username,
            password: password
        });

        res.status(201).json({
            message: "Signup successful"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    try {
        const user = await users.findOne({
            username: username
        });

        if (!user || user.password !== password) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        res.status(200).json({
            message: "Login successful"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/projects", async (req, res) => {
    const { name, description, status, project_lead_id } = req.body;

    if (!name || !description || !status || !project_lead_id) {
        return res.status(400).json({
            message: "All project fields are required"
        });
    }

    if (!["Planning", "Active", "Completed"].includes(status)) {
        return res.status(400).json({
            message: "Invalid project status"
        });
    }

    if (!ObjectId.isValid(project_lead_id)) {
        return res.status(400).json({
            message: "Invalid Project Lead"
        });
    }

    try {
        const leadId = new ObjectId(project_lead_id);

        const lead = await users.findOne({
            _id: leadId
        });

        if (!lead) {
            return res.status(404).json({
                message: "Project Lead does not exist"
            });
        }

        const result = await projects.insertOne({
            name: name,
            description: description,
            status: status,
            project_lead_id: leadId
        });

        await projectMemberships.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        res.status(201).json({
            message: "Project created successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/projects", async (req, res) => {
    try {
        const allProjects = await projects.find().toArray();

        for (const project of allProjects) {
            const lead = await users.findOne({
                _id: project.project_lead_id
            });

            project.project_lead = lead ? lead.username : "Unknown";
        }

        res.json(allProjects);
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

startServer();