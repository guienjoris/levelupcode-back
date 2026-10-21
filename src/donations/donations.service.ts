import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BmcWebhookDto } from './dto/bmc-webhook.dto.js';
import { QueryDonationsDto } from './dto/query-donations.dto.js';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Traitement idempotent du webhook Buy Me a Coffee.
   * Enregistre le don et confère automatiquement le statut Supporter à l'utilisateur correspondant.
   */
  async handleBmcWebhook(payload: BmcWebhookDto) {
    // Normalisation des données depuis payload racine, data ou response
    const data: Record<string, any> = (payload.data || payload.response || payload) as Record<string, any>;
    const p = payload as any;

    const rawTransactionId =
      data.transaction_id ||
      data.id ||
      p.transaction_id ||
      p.id ||
      `bmc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bmcTransactionId = String(rawTransactionId).trim();

    const rawEmail =
      data.supporter_email ||
      data.payer_email ||
      p.supporter_email ||
      p.supporterEmail ||
      p.email ||
      '';
    const supporterEmail = String(rawEmail).trim().toLowerCase();

    const rawName =
      data.supporter_name ||
      data.payer_name ||
      p.supporter_name ||
      p.supporterName ||
      'Supporter Anonyme';
    const supporterName = String(rawName).trim();

    const rawAmount =
      data.support_amount ||
      data.amount ||
      p.amount ||
      p.support_amount ||
      5.0;
    const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 5.0;

    const rawCurrency =
      data.support_currency ||
      data.currency ||
      p.currency ||
      'EUR';
    const currency = String(rawCurrency).toUpperCase();

    const rawMessage =
      data.support_note ||
      data.message ||
      p.message ||
      p.support_note ||
      null;
    const message = rawMessage ? String(rawMessage).trim() : null;

    // 1. Contrôle d'idempotence
    const existing = await this.prisma.donation.findUnique({
      where: { bmcTransactionId },
      include: {
        user: {
          select: { id: true, email: true, name: true, isSupporter: true },
        },
      },
    });

    if (existing) {
      this.logger.log(`Webhook BMC ignoré : transaction ${bmcTransactionId} déjà traitée.`);
      return {
        success: true,
        message: 'Donation déjà enregistrée (idempotence respectée).',
        alreadyProcessed: true,
        donation: existing,
      };
    }

    // 2. Recherche d'un compte utilisateur existant avec cette adresse email
    const user = supporterEmail
      ? await this.prisma.user.findUnique({
          where: { email: supporterEmail },
        })
      : null;

    // 3. Enregistrement transactionnel du don et activation du badge supporter
    const result = await this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          bmcTransactionId,
          supporterEmail: supporterEmail || 'anonyme@buymeacoffee.com',
          supporterName,
          amount,
          currency,
          message,
          userId: user?.id ?? null,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, isSupporter: true },
          },
        },
      });

      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            isSupporter: true,
            supporterSince: user.supporterSince || new Date(),
          },
        });
      }

      return donation;
    });

    this.logger.log(
      `Donation BMC enregistrée : ${amount} ${currency} de "${supporterName}" (${supporterEmail}). Utilisateur lié : ${
        user ? user.id : 'aucun compte pour le moment'
      }`,
    );

    return {
      success: true,
      message: 'Donation enregistrée avec succès. Badge Supporter activé.',
      donation: result,
      userUpdated: !!user,
    };
  }

  /**
   * Retourne l'historique des dons et le statut supporter du membre connecté.
   */
  async getMyDonations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isSupporter: true,
        supporterSince: true,
        donations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            currency: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      isSupporter: user?.isSupporter ?? false,
      supporterSince: user?.supporterSince ?? null,
      donations: user?.donations ?? [],
    };
  }

  /**
   * Liste publique des donateurs récents (Mur des Supporters).
   * Les adresses emails sont masquées pour préserver la vie privée.
   */
  async getRecentSupporters(limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const donations = await this.prisma.donation.findMany({
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        supporterName: true,
        amount: true,
        currency: true,
        message: true,
        createdAt: true,
      },
    });

    return donations;
  }

  /**
   * Consultation paginée des dons avec statistiques globales pour l'administrateur.
   */
  async findAll(query: QueryDonationsDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.email) {
      where.supporterEmail = { contains: query.email.toLowerCase().trim() };
    }

    const [donations, total, stats] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              isSupporter: true,
            },
          },
        },
      }),
      this.prisma.donation.count({ where }),
      this.prisma.donation.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      data: donations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats._sum.amount ?? 0,
        totalDonations: stats._count.id ?? 0,
      },
    };
  }

  /**
   * Lie d'éventuels dons antérieurs réalisés avec la même adresse email
   * lors de la création d'un nouveau compte utilisateur.
   */
  async linkUserDonations(userId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const donations = await this.prisma.donation.findMany({
      where: {
        supporterEmail: normalizedEmail,
        userId: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (donations.length > 0) {
      const earliestDate = donations[0].createdAt;
      await this.prisma.$transaction([
        this.prisma.donation.updateMany({
          where: { supporterEmail: normalizedEmail },
          data: { userId },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: {
            isSupporter: true,
            supporterSince: earliestDate,
          },
        }),
      ]);
    }
  }
}
