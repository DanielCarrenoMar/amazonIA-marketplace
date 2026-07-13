import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  console.log('Seeding fake notifications...');

  // 1. Obtener todos los usuarios
  const users = await prisma.userAccount.findMany();

  if (users.length === 0) {
    console.log('No users found in the database. Run normal seed first.');
    return;
  }

  // 2. Por cada usuario, crear notificaciones simuladas
  let count = 0;
  for (const user of users) {
    const notifications = [
      {
        userId: user.id,
        title: '¡Bienvenido a AmazonIA Marketplace!',
        message: 'Tu cuenta ha sido creada exitosamente. Empieza a explorar productos increíbles.',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // Hace 3 días
      },
      {
        userId: user.id,
        title: 'Actualización de Pedido',
        message: 'Tu orden ORD-84920 ha cambiado de estado a SHIPPED.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // Hace 2 horas
      },
      {
        userId: user.id,
        title: 'Alerta de Seguridad',
        message: 'Se ha detectado un inicio de sesión desde un nuevo dispositivo.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // Hace 15 minutos
      },
      {
        userId: user.id,
        title: 'Nuevo Mensaje',
        message: 'Tienes un nuevo mensaje del vendedor Carlos Artesanías.',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Hace 1 día
      }
    ];

    await prisma.notification.createMany({
      data: notifications,
    });
    
    count += notifications.length;
  }

  console.log(`Successfully created ${count} notifications for ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
