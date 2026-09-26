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

    content = content.replace('import { PrismaClient } from "@upchaar/db";', 'import { prisma } from "@upchaar/db";');
    content = content.replace('import { PrismaClient, Prisma } from "@upchaar/db";', 'import { prisma, Prisma } from "@upchaar/db";');
    content = content.replace('import { Prisma, PrismaClient } from "@upchaar/db";', 'import { prisma, Prisma } from "@upchaar/db";');
    
    content = content.replace('const prisma = new PrismaClient();', '');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
