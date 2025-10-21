CutLogic - A Smart Cutting Stock Optimizer

https://cut-logic-optimizer-aj17oerm2-tapanx4s-projects.vercel.app/ | [GitHub Repository](https://github.com/Tapanx4/CutLogic-Optimizer)


CutLogic is a full-stack web application that solves the complex 2D cutting stock problem. It provides an intuitive user interface for users to input stock sheet dimensions and a list of pieces to be cut, and it uses a powerful backend algorithm to calculate the most efficient layout to minimize waste.

The application is built with a modern tech stack, featuring a Node.js/Express backend that runs a sophisticated packing algorithm and a dynamic React frontend that visualizes the optimal cutting patterns in a clean, professional interface.

Key Features

Efficient Packing Algorithm: The backend uses the maxrects-packer library, which employs an advanced multi-heuristic competition to find a near-optimal solution, significantly reducing material waste.

Decimal Precision: The entire system is designed to handle decimal inputs for both sheet and piece dimensions, using a precision scaling strategy to ensure accurate geometric calculations.

Interactive Frontend: The React user interface provides a clean, modern form for data entry and an intuitive, tabbed view to display the results for each required sheet.

Professional Visualization: The final cutting patterns are rendered in a clear, easy-to-understand "blueprint" style, with color-coded pieces, dimension labels, and a summary of key metrics like sheets used, total waste, and material efficiency.

Full-Stack Architecture: A classic client-server architecture with a React frontend that communicates with a Node.js/Express backend via a REST API.

Technology Stack

Category

Technology

Frontend

React, Axios, Tailwind CSS

Backend

Node.js, Express, maxrects-packer

How It Works

Input: The user provides the dimensions of the stock sheets and a list of required pieces with their dimensions and quantities.

API Request: The React frontend sends this data to the Express backend API.

Precision Scaling: The backend multiplies all decimal inputs by a precision factor (e.g., 100) to convert them into integers, which is ideal for geometric calculations.

Multi-Heuristic Optimization: The backend runs a "tournament" where it tests multiple packing algorithms (heuristics) and piece orderings to find the most efficient layout (the one with the least waste).

Data Formatting: The backend converts the optimal solution into a simple, easy-to-send JSON format and scales the results back down to their original decimal units.

Visualization: The React frontend receives the JSON data and dynamically renders the professional, color-coded cutting plans for each sheet.