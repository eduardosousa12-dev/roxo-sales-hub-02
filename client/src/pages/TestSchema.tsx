import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSchema() {
  const [schemaInfo, setSchemaInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testTables();
  }, []);

  const testTables = async () => {
    try {
      const results: any = {};

      // Test activities table
      const { data: activities, error: actErr } = await supabase
        .from("activities")
        .select("*")
        .limit(1);
      
      results.activities = {
        error: actErr?.message || null,
        columns: activities && activities.length > 0 ? Object.keys(activities[0]) : [],
        sample: activities && activities.length > 0 ? activities[0] : null
      };

      // Test leads table
      const { data: leads, error: leadsErr } = await supabase
        .from("leads")
        .select("*")
        .limit(1);
      
      results.leads = {
        error: leadsErr?.message || null,
        columns: leads && leads.length > 0 ? Object.keys(leads[0]) : [],
        sample: leads && leads.length > 0 ? leads[0] : null
      };

      // Test profiles table
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);
      
      results.profiles = {
        error: profErr?.message || null,
        columns: profiles && profiles.length > 0 ? Object.keys(profiles[0]) : [],
        sample: profiles && profiles.length > 0 ? profiles[0] : null
      };

      // Test payments table
      const { data: payments, error: payErr } = await supabase
        .from("payments")
        .select("*")
        .limit(1);
      
      results.payments = {
        error: payErr?.message || null,
        columns: payments && payments.length > 0 ? Object.keys(payments[0]) : [],
        sample: payments && payments.length > 0 ? payments[0] : null
      };

      setSchemaInfo(results);
    } catch (error: any) {
      console.error("Schema test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Database Schema Test</h1>
      
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p>Loading schema information...</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(schemaInfo).map(([tableName, info]: [string, any]) => (
          <Card key={tableName}>
            <CardHeader>
              <CardTitle>{tableName}</CardTitle>
            </CardHeader>
            <CardContent>
              {info.error ? (
                <div className="text-destructive">
                  <p className="font-semibold">Error:</p>
                  <p>{info.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">Columns ({info.columns.length}):</p>
                    <pre className="bg-muted p-2 rounded mt-2 text-sm overflow-x-auto">
                      {JSON.stringify(info.columns, null, 2)}
                    </pre>
                  </div>
                  {info.sample && (
                    <div>
                      <p className="font-semibold">Sample Data:</p>
                      <pre className="bg-muted p-2 rounded mt-2 text-sm overflow-x-auto">
                        {JSON.stringify(info.sample, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
