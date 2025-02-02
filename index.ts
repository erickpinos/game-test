import dotenv from 'dotenv';
import { GameAgent, GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 1. Create a response function
const respondFunction = new GameFunction({
    name: "respond",
    description: "Generates a response to user input",
    args: [
        { name: "message", type: "string", description: "The response message" }
    ] as const,
    executable: async (args, logger) => {
        try {
            const response = `🤖 ${args.message}`;
            console.log("\n=== AI Response ===");
            console.log(response);
            console.log("==================\n");
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully sent response: ${response}`
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to send response"
            );
        }
    }
});

// 2. Create a worker
const worker = new GameWorker({
    id: "response_worker",
    name: "Response Worker",
    description: "A worker that generates thoughtful responses to user messages",
    functions: [respondFunction],
    getEnvironment: async () => {
        return {
            maxResponseLength: 200
        };
    }
});

// 3. Create state management function
const getAgentState = async () => {
    return {
        messageCount: 0,
        lastMessage: null as string | null,
        conversationHistory: [] as string[]
    };
};

// 4. Create the agent
const API_KEY = process.env.GAME_API_KEY;
if (!API_KEY) {
    throw new Error("Please set GAME_API_KEY in your .env file");
}

const agent = new GameAgent(API_KEY, {
    name: "Chat Bot",
    goal: "Generate helpful and engaging responses to user messages",
    description: `A fabulous digital queen who embodies RuPaul's spirit of empowerment and authenticity. 
    He's part mentor, part entertainer, and full-time icon who:
    - Delivers advice with sass and class
    - Loves to throw in iconic drag race quotes
    - Encourages everyone to embrace their inner diva
    - Knows when to be fierce and when to be nurturing
    - Always keeps it real while keeping it fun
    - Has a witty response for every situation
    - Spreads the message of self-love and acceptance

    Can switch between being a supportive mother figure and a straight-shooting judge, 
    always ready with a "Good luck, and don't f*ck it up!" or "Can I get an amen up in here?`,
    getAgentState: getAgentState,
    workers: [worker]
});

// 5. Add custom logger
agent.setLogger((msg) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(msg);
    console.log("\n");
});

// Function to handle user input
const handleUserInput = async (input: string) => {
    try {
        const agentWorker = agent.getWorkerById(worker.id);
        if (!agentWorker) {
            throw new Error("Worker not found");
        }

        const task = `Generate a thoughtful response to this user message: "${input}"`;
        await agentWorker.runTask(task);

        // Prompt for next message
        promptUser();
    } catch (error) {
        console.error("Error processing message:", error);
        promptUser();
    }
};

// Function to prompt for user input
const promptUser = () => {
    rl.question('\nEnter your message (or "exit" to quit): ', (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log('Goodbye! 👋');
            rl.close();
            process.exit(0);
        } else {
            handleUserInput(input);
        }
    });
};

// 6. Initialize and run
const main = async () => {
    try {
        console.log("Initializing agent...");
        await agent.init();
        console.log("Agent initialized successfully");
        
        console.log("\nWelcome to the Chat Bot! Type your message and press Enter.");
        console.log("Type 'exit' to quit the program.");
        
        // Start the conversation
        promptUser();
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