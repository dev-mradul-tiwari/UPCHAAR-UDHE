const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Users/r1880/Downloads/mradul-upchar.1/mradul-upchar/apps/health-worker/app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1: Just PrismaClient
    content = content.replace(
        /import\s*\{\s*PrismaClient\s*\}\s*from\s*["']@upchaar\/db["'];\r?\n\s*const\s*prisma\s*=\s*new\s*PrismaClient\(\);/g,
        'import { prisma } from "@upchaar/db";'
    );

    // Pattern 2: PrismaClient and Prisma
    content = content.replace(
        /import\s*\{\s*PrismaClient\s*,\s*Prisma\s*\}\s*from\s*["']@upchaar\/db["'];\r?\n\s*const\s*prisma\s*=\s*new\s*PrismaClient\(\);/g,
        'import { prisma, Prisma } from "@upchaar/db";'
    );
    
    // Pattern 3: Prisma and PrismaClient
    content = content.replace(
        /import\s*\{\s*Prisma\s*,\s*PrismaClient\s*\}\s*from\s*["']@upchaar\/db["'];\r?\n\s*const\s*prisma\s*=\s*new\s*PrismaClient\(\);/g,
        'import { Prisma, prisma } from "@upchaar/db";'
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
