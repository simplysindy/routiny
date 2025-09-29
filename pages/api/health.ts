import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../src/lib/clients";

type HealthData = {
  status: string;
  timestamp: string;
  version: string;
  services: {
    supabase: {
      status: string;
      connected: boolean;
      error?: string;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        supabase: {
          status: "not_tested",
          connected: false,
        },
      },
    });
  }

  // Test Supabase connection
  let supabaseStatus: HealthData["services"]["supabase"] = {
    status: "error",
    connected: false,
    error: "unknown",
  };

  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact" })
      .limit(0);

    if (error) {
      supabaseStatus = {
        status: "error",
        connected: false,
        error: error.message,
      };
    } else {
      supabaseStatus = {
        status: "ok",
        connected: true,
      };
    }
  } catch (err) {
    supabaseStatus = {
      status: "error",
      connected: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }

  const overallStatus = supabaseStatus.connected ? "ok" : "degraded";

  res.status(200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      supabase: supabaseStatus,
    },
  });
}
