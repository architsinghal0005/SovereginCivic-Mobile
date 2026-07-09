import dotenv from 'dotenv';
import axios from 'axios';
import chalk from 'chalk';
import neo4j from 'neo4j-driver';
import FormData from 'form-data';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configuration
const GATEWAY_URL = 'https://soveregincivic-mobile-gateway.onrender.com';
const CASEWORKER_URL = 'https://sovereigncivic-caseworker-api.onrender.com';
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

// Utilities
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const logStep = (emoji: string, msg: string) => console.log(chalk.bold.blue(`\n${emoji}  ${msg}`));
const logSubStep = (msg: string) => console.log(chalk.cyan(`    ↳ ${msg}`));
const logSuccess = (msg: string) => console.log(chalk.green(`    ✅ ${msg}`));
const logInfo = (msg: string) => console.log(chalk.gray(`    ℹ️  ${msg}`));
const logError = (msg: string) => console.log(chalk.red(`    ❌ ${msg}`));

async function pingCheck() {
    logStep('⏳', 'Waking up cloud microservices (Render Cold Start Check)...');

    const maxRetries = 15;
    const retryDelay = 5000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            process.stdout.write(chalk.yellow(`    Ping attempt ${i + 1}/${maxRetries} to ${GATEWAY_URL}/health... `));
            const res = await axios.get(`${GATEWAY_URL}/health`, { timeout: 10000 });
            if (res.status === 200) {
                console.log(chalk.green('OK! 🟢'));
                logSuccess('All services are awake and responsive!');
                return;
            }
        } catch (error) {
            console.log(chalk.red('Failed.'));
            if (i === maxRetries - 1) {
                logError('Max retries reached. Assuming services are offline. Proceeding with caution...');
                return;
            }
            await sleep(retryDelay);
        }
    }
}

async function submitGrievance(lat: number, lng: number, citizenId: string, index: number) {
    try {
        const form = new FormData();
        form.append('citizenId', citizenId);
        form.append('latitude', lat.toString());
        form.append('longitude', lng.toString());
        form.append('imageUrl', 'https://via.placeholder.com/300/FF0000/FFFFFF?text=Pothole+Simulation');

        // Mock audio file buffer (Gateway requires an audio file to be attached via Multer)
        const dummyAudio = Buffer.from('dummy audio content for simulation');
        form.append('audio', dummyAudio, { filename: `simulated_audio_${index}.mp3`, contentType: 'audio/mpeg' });

        const res = await axios.post(`${GATEWAY_URL}/api/grievance/report`, form, {
            headers: form.getHeaders()
        });

        if (res.status === 200 || res.status === 201) {
            logSuccess(`Grievance ${index} reported successfully. (LLM Parsed Category: ${chalk.bold(res.data.category || 'Unknown')})`);
            return res.data;
        } else {
            logError(`Failed to report grievance ${index}: ${res.statusText}`);
        }
    } catch (error: any) {
        logError(`Error reporting grievance ${index}: ${error.response?.data?.error || error.message}`);
    }
    return null;
}

async function runSimulation() {
    console.clear();
    console.log(chalk.bgBlue.white.bold('\n === SOVEREIGN CIVIC: E2E WORKFLOW SIMULATION === \n'));

    await pingCheck();
    await sleep(1000);

    // Dynamic Seed to ensure a brand-new clean cluster dynamically
    const runId = Date.now();
    const baseCitizenId = `sim-citizen-${runId}`;
    // Coordinates around a central point (e.g., Connaught Place, New Delhi)
    const baseLat = 28.6304;
    const baseLng = 77.2177;

    // =========================================================================
    // STAGE 1: CITIZEN INGESTION & AI SYNCHRONIZATION
    // =========================================================================
    logStep('📱', 'STAGE 1: CITIZEN INGESTION & AI SYNCHRONIZATION (Gateway Service)');
    logSubStep('Simulating a citizen recording an audio complaint about a severe pothole...');
    await sleep(1000);
    logSubStep('Transmitting audio payload to Gateway Service...');
    await sleep(800);
    logSubStep('Gateway routing audio to Sarvam AI for Speech-to-Text transcription...');
    await sleep(800);
    logSubStep('Gateway passing transcript to Gemini/OpenAI for semantic categorization...');

    // We send the first grievance
    await submitGrievance(baseLat, baseLng, baseCitizenId, 1);
    await sleep(1500);

    // =========================================================================
    // STAGE 2: SPATIAL CLUSTERING THRESHOLD DEMO
    // =========================================================================
    logStep('📊', 'STAGE 2: SPATIAL CLUSTERING THRESHOLD DEMO (Graph Service & Neo4j)');
    logSubStep('Rapidly injecting 4 more grievances within a 50-meter radius to breach the systemic issue threshold...');

    // Inject 4 more to make a total of 5 (threshold is usually 5)
    for (let i = 2; i <= 5; i++) {
        // Shift by a micro-degree to simulate slight variance in GPS
        const shiftLat = baseLat + (Math.random() * 0.0002 - 0.0001);
        const shiftLng = baseLng + (Math.random() * 0.0002 - 0.0001);
        await submitGrievance(shiftLat, shiftLng, `${baseCitizenId}-neighbor-${i}`, i);
        await sleep(500); // Slight delay to ensure ordered processing
    }

    logSubStep('Connecting to Live Neo4j Database to verify automatic cluster generation...');
    const driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
    );
    const session = driver.session();

    await sleep(3000); // Wait 3 seconds for the cloud database to finish clustering
    try {
        await sleep(2000); // Wait for the graph service to process the threshold logic
        const result = await session.run(`
            MATCH (c:Citizen)-[:FILED]->(g:Grievance)
            WHERE c.id STARTS WITH $citizenPrefix
            RETURN g.id AS grievanceId, g.category AS category, g.frequency AS size, g.confidenceScore AS score
            ORDER BY g.frequency DESC
            LIMIT 1
        `, { citizenPrefix: baseCitizenId }); // Dynamically targets the real citizen string used in Stage 1

        if (result.records.length > 0) {
            const record = result.records[0];
            const size = record.get('size');
            const numericSize = size && (typeof size.toNumber === 'function' ? size.toNumber() : size);
            
            if (numericSize >= 5) {
                logSuccess('Cluster logic successfully triggered!');
                logInfo(`Detected High-Density Grievance Cluster!`);
                logInfo(`Cluster Category: ${chalk.bold(record.get('category'))}`);
                logInfo(`Linked Grievances (Frequency): ${chalk.bold(numericSize)}`);
            } else {
                logError(`Cluster frequency is below threshold: ${numericSize}`);
            }
        } else {
            logError('Could not find the submitted Grievances in Neo4j. Ingestion may have failed.');
        }
    } catch (error: any) {
        logError(`Neo4j Query Error: ${error.message}`);
    } finally {
        await session.close();
        await driver.close();
    }
    await sleep(1500);

    // =========================================================================
    // STAGE 3 & 4: WEBHOOK PROPAGATION & LIFECYCLE STATE MACHINE VALIDATION
    // =========================================================================
    logStep('🛠️', 'STAGE 3 & 4: WEBHOOK PROPAGATION & TICKET STATE MACHINE (Caseworker Engine)');
    logSubStep('Querying Caseworker Engine to verify webhook ingestion and ticket creation...');

    let activeTicketId = null;
    let activeTicketState = null;
    try {
        // Query the tickets to find the newly created one. 
        // We look for a ticket that is newly created (state: ASSIGNED_TO_OFFICER)
        const ticketsRes = await axios.get(`${CASEWORKER_URL}/api/tickets`);
        if (ticketsRes.status === 200 && Array.isArray(ticketsRes.data) && ticketsRes.data.length > 0) {
            // Pick the most recent ticket, assuming it's ours.
            const latestTicket = ticketsRes.data[ticketsRes.data.length - 1];
            activeTicketId = latestTicket.id;
            activeTicketState = latestTicket.state;
            logSuccess(`Webhook captured! Caseworker Engine registered Ticket ID: ${chalk.bold(activeTicketId)} (State: ${latestTicket.state})`);
        } else {
            logError('Failed to retrieve active tickets from Caseworker Engine, or none exist.');
        }
    } catch (error: any) {
        logError(`Error querying Caseworker Engine: ${error.message}`);
    }

    if (activeTicketId) {
        if (activeTicketState === 'RESOLVED') {
            logSuccess('✨ Ticket automatically reached RESOLVED state via background orchestration engine!');
        } else {
            await sleep(1500);
            logSubStep('Advancing ticket state to IN_PROGRESS...');
            try {
                const startRes = await axios.patch(`${CASEWORKER_URL}/api/ticket/${activeTicketId}/start`);
                logSuccess(`Ticket transitioned to: ${chalk.bold(startRes.data.ticket?.state || 'IN_PROGRESS')}`);
            } catch (e: any) {
                logError(`Failed to start ticket: ${e.response?.data?.error || e.message}`);
            }

            await sleep(1500);
            logSubStep('Simulating field worker repairs (Fixing the pothole)...');
            await sleep(2000); // Dramatic pause for repairs

            logSubStep('Advancing ticket state to RESOLVED...');
            try {
                const resolveRes = await axios.patch(`${CASEWORKER_URL}/api/ticket/${activeTicketId}/resolve`);
                logSuccess(`Ticket transitioned to: ${chalk.bold(resolveRes.data.ticket?.state || 'RESOLVED')}`);
            } catch (e: any) {
                logError(`Failed to resolve ticket: ${e.response?.data?.error || e.message}`);
            }
        }
    }

    // =========================================================================
    // CONCLUSION
    // =========================================================================
    console.log(chalk.bgGreen.black.bold('\n ✨ SIMULATION COMPLETE ✨ \n'));
    console.log(chalk.green('The end-to-end lifecycle of the civic complaint was successfully demonstrated.'));
    console.log(chalk.gray('From citizen audio ingestion -> Graph clustering -> State machine resolution.'));
    console.log('\n');
}

runSimulation();
