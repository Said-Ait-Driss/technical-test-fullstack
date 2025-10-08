import { prisma } from "@lib/prisma";
/**
 * TODO:
 * - Lister les paiements (50 derniers) triés par date desc.
 * - Afficher le total des montants (en centimes) en tête
 * - Colonnes: date, montant, devise, statut, session, email
 */

// Formater le montant pour l'affichage
const formatAmount = (amount: number | null) => {
  if (!amount) return "0.00";
  return (amount / 100).toFixed(2); // Conversion cents → unité
};

// Formater la date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

function Pagination({
  currentPage,
  totalPages,
  baseUrl = "",
}: PaginationProps) {
  const getPageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </div>
      <div className="flex gap-2">
        {/* Bouton Précédent */}
        <a
          href={currentPage > 1 ? getPageUrl(currentPage - 1) : "#"}
          className={`px-3 py-2 text-sm border rounded-md ${
            currentPage > 1
              ? "hover:bg-accent hover:text-accent-foreground cursor-pointer"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          Précédent
        </a>

        {/* Pages */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <a
              key={pageNum}
              href={getPageUrl(pageNum)}
              className={`px-3 py-2 text-sm border rounded-md ${
                currentPage === pageNum
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {pageNum}
            </a>
          );
        })}

        {/* Bouton Suivant */}
        <a
          href={currentPage < totalPages ? getPageUrl(currentPage + 1) : "#"}
          className={`px-3 py-2 text-sm border rounded-md ${
            currentPage < totalPages
              ? "hover:bg-accent hover:text-accent-foreground cursor-pointer"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          Suivant
        </a>
      </div>
    </div>
  );
}

// table component
function PaymentsTable({ payments }: { payments: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-3 px-4 font-medium">Date</th>
          <th className="text-left py-3 px-4 font-medium">Montant</th>
          <th className="text-left py-3 px-4 font-medium">Devise</th>
          <th className="text-left py-3 px-4 font-medium">Statut</th>
          <th className="text-left py-3 px-4 font-medium">Session Stripe</th>
          <th className="text-left py-3 px-4 font-medium">Email</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((payment: any) => (
          <tr key={payment.id} className="border-b hover:bg-muted/50">
            <td className="py-3 px-4">{formatDate(payment.createdAt)}</td>
            <td className="py-3 px-4 font-medium">
              {formatAmount(payment.amount)}
            </td>
            <td className="py-3 px-4 uppercase">{payment.currency || "N/A"}</td>
            <td className="py-3 px-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  payment.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : payment.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {payment.status}
              </span>
            </td>
            <td className="py-3 px-4 font-mono text-xs">
              {payment.stripeSessionId}
            </td>
            <td className="py-3 px-4">{payment.customerEmail || "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface AdminPageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || "1"));
  const itemsPerPage = 50;

  // Récupérer le nombre total de paiements pour la pagination
  const totalPayments = await prisma.payment.count();

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalPayments / itemsPerPage);

  // Récupérer les paiements avec pagination
  const payments = await prisma.payment.findMany({
    take: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculer le total des montants pour tous les paiements
  const totalAmountResult = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
  });

  const totalAmount = totalAmountResult._sum.amount || 0;

  return (
    <main className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Administration des Paiements</h1>
      </div>

      {/* Carte du total */}
      <div className="card bg-primary text-primary-foreground">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Total des Paiements</h2>
          <p className="text-3xl font-bold">{formatAmount(totalAmount)} €</p>
          <p className="text-sm opacity-90 mt-1">
            {totalPayments} paiement(s) au total
          </p>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="card">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Paiements ({totalPayments} au total)
            </h2>
            <div className="text-sm text-muted-foreground">
              Affichage {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalPayments)} sur{" "}
              {totalPayments}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun paiement enregistré pour le moment.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                {/* payment table */}
                <PaymentsTable payments={payments} />
              </div>
              {/* Pagination */}
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
