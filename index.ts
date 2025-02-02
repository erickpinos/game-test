import dotenv from 'dotenv';
import { GameAgent, GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

// Load environment variables
dotenv.config();

// Validate API key
const API_KEY = process.env.GAME_API_KEY;
if (!API_KEY) {
    throw new Error("Please set GAME_API_KEY in your .env file");
}

// 1. Create a simple function
const greetFunction = new GameFunction({
    name: "greet",
    description: "Sends a greeting message",
    args: [
        { name: "message", type: "string", description: "The greeting message" }
    ] as const,
    executable: async (args, logger) => {
        try {
            console.log(`Greeting: ${args.message}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                "Greeting sent successfully"
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to send greeting"
            );
        }
    }
});

// 2. Create a worker
const worker = new GameWorker({
    id: "greeting_worker",
    name: "Greeting Worker",
    description: "A worker that sends greetings",
    functions: [greetFunction],
    getEnvironment: async () => {
        return {
            maxGreetings: 5
        };
    }
});

// 3. Create state management function
const getAgentState = async () => {
    return {
        greetingCount: 0,
        lastGreeting: null
    };
};

// 4. Create the agent
const agent = new GameAgent(API_KEY, {
    name: "Greeting Bot",
    goal: "Send friendly greetings",
    description: "A bot that sends friendly greetings to users",
    getAgentState: getAgentState,
    workers: [worker]
});

// 5. Add custom logger (optional)
agent.setLogger(agent, (msg) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(msg);
    console.log("\n");
});

// 6. Initialize and run with proper async handling
const main = async () => {
    try {
        console.log("Initializing agent...");
        await agent.init();
        console.log("Agent initialized successfully");
        
        console.log("Starting agent...");
        await agent.run(60, { verbose: true });
    } catch (error) {
        console.error("Error running agent:", error);
        process.exit(1);
    }
};

// Run the main function
main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
});