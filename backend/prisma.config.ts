import 'dotenv/config';

export default {
  schema: './prisma/schema.prisma',
  migrate: {
    path: './prisma/migrations',
  },
};
