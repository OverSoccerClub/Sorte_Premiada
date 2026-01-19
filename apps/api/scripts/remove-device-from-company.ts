import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDeviceFromCompany() {
    try {
        // ID do dispositivo que você quer remover
        // Você pode obter isso pelo deviceId (ex: ARSP51031240297) ou pelo nome
        const DEVICE_ID = 'ARSP51031240297'; // Substitua pelo deviceId correto se necessário

        console.log(`🔍 Buscando dispositivo: ${DEVICE_ID}...`);

        // Buscar o dispositivo
        const device = await prisma.posTerminal.findUnique({
            where: {
                deviceId: DEVICE_ID
            },
            include: {
                company: true
            }
        });

        if (!device) {
            console.log(`❌ Dispositivo ${DEVICE_ID} não encontrado no banco de dados.`);
            return;
        }

        console.log(`\n📱 Dispositivo encontrado:`);
        console.log(`   - ID: ${device.id}`);
        console.log(`   - Device ID: ${device.deviceId}`);
        console.log(`   - Nome: ${device.name || 'Sem nome'}`);
        console.log(`   - Empresa: ${device.company?.companyName || 'Sem empresa'}`);
        console.log(`   - Código de Ativação: ${device.activationCode || 'Sem código'}`);
        console.log(`   - Ativo: ${device.isActive ? 'Sim' : 'Não'}`);

        // Confirmar se é a empresa Lotto Forte
        if (device.company?.companyName !== 'Lotto Forte') {
            console.log(`\n⚠️  ATENÇÃO: Este dispositivo está vinculado a "${device.company?.companyName}", não à "Lotto Forte".`);
            console.log(`   Deseja continuar mesmo assim? (Edite o script para confirmar)`);
            return;
        }

        console.log(`\n🗑️  Removendo dispositivo da empresa "Lotto Forte"...`);

        // OPÇÃO 1: Deletar completamente o dispositivo
        // await prisma.posTerminal.delete({
        //     where: {
        //         id: device.id
        //     }
        // });

        // OPÇÃO 2: Apenas desassociar da empresa (RECOMENDADO)
        await prisma.posTerminal.update({
            where: {
                id: device.id
            },
            data: {
                companyId: null,
                currentUserId: null,
                lastUserId: null,
                areaId: null,
                activationCode: null,
                deviceToken: null,
                activatedAt: null,
                isActive: false,
                name: null,
                description: null
            }
        });

        console.log(`\n✅ Dispositivo removido com sucesso!`);
        console.log(`   O dispositivo agora está disponível para ser ativado em outra empresa.`);

    } catch (error) {
        console.error(`\n❌ Erro ao remover dispositivo:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar o script
removeDeviceFromCompany()
    .then(() => {
        console.log(`\n✨ Script finalizado.`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(`\n💥 Erro fatal:`, error);
        process.exit(1);
    });
