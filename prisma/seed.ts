import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminWallet = process.env.ADMIN_WALLET_ADDRESS || "0x0000000000000000000000000000000000000001";

  // Upsert admin user
  await prisma.user.upsert({
    where: { wallet_address: adminWallet },
    update: {},
    create: {
      wallet_address: adminWallet,
      github_username: "questlock-admin",
    },
  });

  // Create sample quest
  const existing = await prisma.quest.findFirst({
    where: { title: "Build a Simple Onchain Guestbook" },
  });

  if (!existing) {
    const startTime = new Date();
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.quest.create({
      data: {
        title: "Build a Simple Onchain Guestbook",
        description:
          "Build and deploy a simple onchain guestbook. Your project must include a Solidity contract, a frontend interface, and a working demo. Push at least 3 commits after the quest starts.",
        quest_type: "github_project",
        requirements_json: {
          githubRepo: true,
          publicRepo: true,
          minCommits: 3,
          readme: true,
          demo: true,
          contracts: true,
          frontend: true,
        },
        scoring_rubric_json: {
          repo_exists: 10,
          owner_matches: 10,
          repo_updated_after_start: 10,
          commits_after_start: 15,
          readme_exists: 10,
          readme_length: 10,
          frontend_files: 10,
          contract_files: 10,
          demo_url_loads: 10,
          not_previously_submitted: 5,
        },
        min_score: 70,
        reward_amount: "10",
        badge_id: 1n,
        start_time: startTime,
        deadline,
        max_claims: 100,
        status: "active",
        created_by: adminWallet,
      },
    });

    console.log("Sample quest created.");
  } else {
    console.log("Sample quest already exists.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
