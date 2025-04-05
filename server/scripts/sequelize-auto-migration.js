#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0] || 'help';

const commands = {
    'generate': 'Generate migration files based on models',
    'migrate': 'Run migrations',
    'status': 'Check migration status',
    'undo': 'Revert last migration',
    'undo-all': 'Revert all migrations',
    'help': 'Show help'
};

const generateMigrationsPath = path.join(__dirname, 'generate-migrations.js');

function executeCommand(cmd) {
    try {
        console.log(`Executing: ${cmd}`);
        const output = execSync(cmd, { stdio: 'inherit' });
        return output ? output.toString() : '';
    } catch (error) {
        console.error(`Command execution error: ${error.message}`);
        process.exit(1);
    }
}

switch (command) {
    case 'generate':
        console.log('Generating migration files based on models...');
        executeCommand(`node ${generateMigrationsPath}`);
        break;

    case 'migrate':
        console.log('Running migrations...');
        executeCommand('npx sequelize-cli db:migrate');
        break;

    case 'status':
        console.log('Checking migration status...');
        executeCommand('npx sequelize-cli db:migrate:status');
        break;

    case 'undo':
        console.log('Reverting last migration...');
        executeCommand('npx sequelize-cli db:migrate:undo');
        break;

    case 'undo-all':
        console.log('Reverting all migrations...');
        executeCommand('npx sequelize-cli db:migrate:undo:all');
        break;

    case 'help':
    default:
        console.log('\nAvailable commands:');
        for (const [cmd, description] of Object.entries(commands)) {
            console.log(`  ${cmd.padEnd(12)} - ${description}`);
        }
        console.log('\nUsage example:');
        console.log('  node scripts/sequelize-auto-migration.js generate');
        console.log('  node scripts/sequelize-auto-migration.js migrate');
        break;
}