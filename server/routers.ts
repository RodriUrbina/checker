import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { analyzeWebsite } from "./analyzer";
import { createAnalysis, getUserAnalyses, getAnalysisById, linkAnalysisToUser, createLead } from "./db";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
  }),

  analysis: router({
    analyze: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const analysisResult = await analyzeWebsite(input.url);

        const savedAnalysis = await createAnalysis({
          userId: ctx.user?.id ?? null,
          url: input.url,
          score: analysisResult.score,
          hasJsonApi: analysisResult.hasJsonApi,
          hasTextApi: analysisResult.hasTextApi,
          hasMarkdownApi: analysisResult.hasMarkdownApi,
          hasRssFeed: analysisResult.hasRssFeed,
          hasAtomFeed: analysisResult.hasAtomFeed,
          hasJsonFeed: analysisResult.hasJsonFeed,
          hasLlmsTxt: analysisResult.hasLlmsTxt,
          hasJsonLd: analysisResult.hasJsonLd,
          hasSemanticHtml: analysisResult.hasSemanticHtml,
          hasServerSideRendering: analysisResult.hasServerSideRendering,
          hasMetaTags: analysisResult.hasMetaTags,
          hasSitemap: analysisResult.hasSitemap,
          hasMcpServer: analysisResult.hasMcpServer,
          details: analysisResult.details,
        });

        return {
          ...savedAnalysis,
          details: analysisResult.details,
        };
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return getUserAnalyses(ctx.user.id);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const analysis = await getAnalysisById(input.id);
        if (!analysis) {
          throw new Error("Analysis not found");
        }
        return analysis;
      }),

    claim: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await getAnalysisById(input.id);
        if (!analysis) {
          throw new Error("Analysis not found");
        }
        // Only claim if not already owned
        if (analysis.userId && analysis.userId !== ctx.user.id) {
          throw new Error("Analysis belongs to another user");
        }
        if (!analysis.userId) {
          return linkAnalysisToUser(input.id, ctx.user.id);
        }
        return analysis;
      }),
  }),

  leads: router({
    submit: publicProcedure
      .input(z.object({ email: z.string().email(), analysisId: z.number() }))
      .mutation(async ({ input }) => {
        const analysis = await getAnalysisById(input.analysisId);
        if (!analysis) {
          throw new Error("Analysis not found");
        }
        await createLead({
          email: input.email,
          analysisId: analysis.id,
          url: analysis.url,
          score: analysis.score,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
