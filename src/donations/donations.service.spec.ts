import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DonationsService } from './donations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('DonationsService', () => {
  let service: DonationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    donation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma);
      }
      return Promise.all(callback);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('handleBmcWebhook', () => {
    it('devrait enregistrer un nouveau don et conférer le statut supporter à l’utilisateur existant', async () => {
      mockPrisma.donation.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'supporter@example.com',
        isSupporter: false,
        supporterSince: null,
      });

      const fakeDonation = {
        id: 'don-1',
        bmcTransactionId: 'tx_12345',
        supporterEmail: 'supporter@example.com',
        supporterName: 'Jane Dev',
        amount: 15.0,
        currency: 'EUR',
        message: 'Bravo pour la qualité des cours !',
        userId: 'u-1',
      };
      mockPrisma.donation.create.mockResolvedValue(fakeDonation);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.handleBmcWebhook({
        transaction_id: 'tx_12345',
        supporter_email: 'supporter@example.com',
        supporter_name: 'Jane Dev',
        amount: 15.0,
        currency: 'EUR',
        message: 'Bravo pour la qualité des cours !',
      });

      expect(result.success).toBe(true);
      expect(result.userUpdated).toBe(true);
      expect(mockPrisma.donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bmcTransactionId: 'tx_12345',
            supporterEmail: 'supporter@example.com',
            amount: 15.0,
            userId: 'u-1',
          }),
        }),
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: expect.objectContaining({ isSupporter: true }),
        }),
      );
    });

    it('devrait gérer l’idempotence si la transaction a déjà été enregistrée', async () => {
      const existingDonation = {
        id: 'don-1',
        bmcTransactionId: 'tx_duplicate',
        amount: 5.0,
      };
      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);

      const result = await service.handleBmcWebhook({
        transaction_id: 'tx_duplicate',
      });

      expect(result.success).toBe(true);
      expect(result.alreadyProcessed).toBe(true);
      expect(mockPrisma.donation.create).not.toHaveBeenCalled();
    });

    it('devrait extraire les données depuis payload.data imbriqué', async () => {
      mockPrisma.donation.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.donation.create.mockResolvedValue({ id: 'don-nested' });

      const result = await service.handleBmcWebhook({
        type: 'donation.created',
        data: {
          transaction_id: 'nested_tx_99',
          supporter_email: 'nested@example.com',
          supporter_name: 'Nested Supporter',
          support_amount: 10.0,
          support_currency: 'USD',
          support_note: 'Super projet',
        },
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bmcTransactionId: 'nested_tx_99',
            supporterEmail: 'nested@example.com',
            amount: 10.0,
            currency: 'USD',
            message: 'Super projet',
            userId: null,
          }),
        }),
      );
    });
  });

  describe('getMyDonations', () => {
    it('devrait renvoyer les contributions et le badge de l’utilisateur connecté', async () => {
      const supporterSince = new Date();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        isSupporter: true,
        supporterSince,
        donations: [
          {
            id: 'd-1',
            amount: 10,
            currency: 'EUR',
            message: 'Keep going!',
            createdAt: supporterSince,
          },
        ],
      });

      const result = await service.getMyDonations('u-1');
      expect(result.isSupporter).toBe(true);
      expect(result.donations.length).toBe(1);
    });
  });

  describe('getRecentSupporters', () => {
    it('devrait renvoyer la liste publique des donateurs sans exposer les emails', async () => {
      mockPrisma.donation.findMany.mockResolvedValue([
        {
          id: 'd-1',
          supporterName: 'Alice',
          amount: 5,
          currency: 'EUR',
          message: 'Merci !',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getRecentSupporters(10);
      expect(result.length).toBe(1);
      expect((result[0] as any).supporterEmail).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('devrait renvoyer la liste paginée et les totaux financiers pour l’admin', async () => {
      mockPrisma.donation.findMany.mockResolvedValue([
        { id: 'd-1', amount: 20, currency: 'EUR' },
      ]);
      mockPrisma.donation.count.mockResolvedValue(1);
      mockPrisma.donation.aggregate.mockResolvedValue({
        _sum: { amount: 20 },
        _count: { id: 1 },
      });

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.stats.totalAmount).toBe(20);
      expect(result.stats.totalDonations).toBe(1);
    });
  });

  describe('linkUserDonations', () => {
    it('devrait rattacher les dons antérieurs et activer le statut supporter', async () => {
      const earliest = new Date('2026-01-01');
      mockPrisma.donation.findMany.mockResolvedValue([
        { id: 'd-old', createdAt: earliest },
      ]);
      mockPrisma.donation.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.update.mockResolvedValue({});

      await service.linkUserDonations('u-new', 'old@supporter.com');

      expect(mockPrisma.donation.updateMany).toHaveBeenCalledWith({
        where: { supporterEmail: 'old@supporter.com' },
        data: { userId: 'u-new' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-new' },
        data: { isSupporter: true, supporterSince: earliest },
      });
    });
  });
});
