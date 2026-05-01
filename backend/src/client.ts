import { Prisma, PrismaClient } from './generated/prisma/index.js';

// add prisma to the NodeJS global type
// interface CustomNodeJsGlobal extends Global {
//   prisma: PrismaClient;
// }

// Prevent multiple instances of Prisma Client in development
// declare const global: CustomNodeJsGlobal;

enum PrismaOperation {
    findUnique = 'findUnique',
    findUniqueOrThrow = 'findUniqueOrThrow',
    findMany = 'findMany',
    findFirst = 'findFirst',
    findFirstOrThrow = 'findFirstOrThrow',
    create = 'create',
    createMany = 'createMany',
    createManyAndReturn = 'createManyAndReturn',
    update = 'update',
    updateMany = 'updateMany',
    updateManyAndReturn = 'updateManyAndReturn',
    upsert = 'upsert',
    delete = 'delete',
    deleteMany = 'deleteMany',
    executeRaw = 'executeRaw',
    queryRaw = 'queryRaw',
    aggregate = 'aggregate',
    count = 'count',
    runCommandRaw = 'runCommandRaw',
    findRaw = 'findRaw',
    groupBy = 'groupBy'
}

const getGlobalFiltersExtension = () => {
    return Prisma.defineExtension({
        name: 'globalFilters',
        query: {
            $allModels: {
                async $allOperations({ operation, args, query }) {
                    const globalData = { isDeleted: false };

                    switch (operation) {
                        case PrismaOperation.findUnique:
                        case PrismaOperation.findUniqueOrThrow:
                        case PrismaOperation.findMany:
                        case PrismaOperation.findFirst:
                        case PrismaOperation.findFirstOrThrow:
                        case PrismaOperation.count:
                        case PrismaOperation.groupBy:
                        case PrismaOperation.aggregate:
                        case PrismaOperation.update:
                        case PrismaOperation.updateMany:
                        case PrismaOperation.updateManyAndReturn:
                        case PrismaOperation.delete:
                        case PrismaOperation.deleteMany:
                            args.where = {
                                ...globalData,
                                ...(args.where as { [key in string]?: any })
                            } as typeof args.where;
                            
                            // If isDeleted is explicitly set to undefined, remove it to bypass filter
                            if (args.where && (args.where as any).isDeleted === undefined) {
                                delete (args.where as any).isDeleted;
                            }
                            break;
                        case PrismaOperation.create:
                            if (args.data && typeof args.data === 'object')
                                args.data = {
                                    ...(globalData as any),
                                    ...(args.data as { [key in string]?: any })
                                } as typeof args.data;
                            break;
                        case PrismaOperation.createMany:
                        case PrismaOperation.createManyAndReturn:
                            if (args.data && Array.isArray(args.data))
                                for (let i = 0; i < args.data.length; i++) {
                                    const item = args.data[i];
                                    if (typeof item === 'object')
                                        args.data[i] = {
                                            ...(globalData as any),
                                            ...(item as { [key in string]?: any })
                                        } as (typeof args.data)[number];
                                }
                            break;

                        case PrismaOperation.upsert:
                            args.where = {
                                ...(globalData as any),
                                ...(args.where as { [key in string]?: any })
                            } as typeof args.where;
                            if (args.create && typeof args.create === 'object')
                                args.create = {
                                    ...(globalData as any),
                                    ...(args.create as { [key in string]?: any })
                                } as typeof args.create;
                            
                            if (args.where && (args.where as any).isDeleted === undefined) {
                                delete (args.where as any).isDeleted;
                            }
                            break;
                        default:
                            break;
                    }

                    return await query(args);
                }
            }
        }
    });
};

const prismaClientSingleton = () => {
    const url = process.env.DATABASE_URL;
    const connectionLimit = 10;
    const poolTimeout = 30;
    
    let urlWithLimit = url;
    if (url) {
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.set('connection_limit', connectionLimit.toString());
            urlObj.searchParams.set('pool_timeout', poolTimeout.toString());
            urlWithLimit = urlObj.toString();
        } catch (e) {
            // Fallback if URL is not valid
            urlWithLimit = url.includes('?') 
                ? `${url}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}` 
                : `${url}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
        }
    }

    return new PrismaClient({
        datasources: {
            db: {
                url: urlWithLimit,
            },
        },
    }).$extends(getGlobalFiltersExtension());
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
