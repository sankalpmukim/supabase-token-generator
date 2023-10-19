import { ChangeEvent, useEffect, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

function App() {
  const configKeys = ["projectUrl", "publicApiAnonKey"] as const;
  const [config, setConfig] = useState({
    projectUrl: "",
    publicApiAnonKey: "",
  });
  const [token, setToken] = useState("");
  const [supabaseInitialized, setSupabaseInitialized] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useState<SupabaseClient<any, "public", any> | null>(null);
  const initializeSupabase = async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(config.projectUrl, config.publicApiAnonKey);

    setSupabaseInitialized(supabase);
  };

  useEffect(() => {
    // Load configuration from localStorage if it exists
    const savedConfig = localStorage.getItem("supabaseConfig");
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
      if (config.projectUrl && config.publicApiAnonKey) {
        initializeSupabase();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.projectUrl, config.publicApiAnonKey]);

  useEffect(() => {
    if (supabaseInitialized) {
      const supabase = supabaseInitialized;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setToken(session.access_token);
        } else {
          setToken("");
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setToken(session.access_token);
        } else {
          setToken("");
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [supabaseInitialized]);

  const handleConfigChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveConfigToLocalStorage = () => {
    localStorage.setItem("supabaseConfig", JSON.stringify(config));
  };

  const deleteAndClearConfig = () => {
    localStorage.removeItem("supabaseConfig");
    setConfig({
      projectUrl: "",
      publicApiAnonKey: "",
    });
    setSupabaseInitialized(null);
  };

  const signIn = async () => {
    if (supabaseInitialized) {
      const supabase = supabaseInitialized;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        console.error(`error in auth`, error);
      } else {
        console.log(`data in auth`, data);
      }
    }
  };

  return (
    <div className="App">
      <h1>Supabase Auth UI</h1>
      {supabaseInitialized ? (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1rem",
            }}
          >
            <button onClick={signIn}>
              {token ? `Use a different account` : `Sign In`}
            </button>
            {token && (
              <button onClick={() => supabaseInitialized?.auth.signOut()}>
                Sign Out
              </button>
            )}
            <button
              onClick={deleteAndClearConfig}
            >{`Delete Config/Use a different Supabase project`}</button>
          </div>
          {token && (
            <div>
              <h2>JWT Token:</h2>
              <textarea readOnly value={token} rows={10} cols={50} />
              <button onClick={() => navigator.clipboard.writeText(token)}>
                Copy Token
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          <h2>Enter Supabase Configuration:</h2>
          {configKeys.map((key) => (
            <div key={key}>
              <label>{key}: </label>
              <input
                name={key}
                value={config[key]}
                onChange={handleConfigChange}
              />
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              padding: "1rem",
              paddingLeft: "0",
              alignItems: "center",
            }}
          >
            <button onClick={saveConfigToLocalStorage}>1. Save Config</button>
            <button onClick={initializeSupabase}>2. Initialize Supabase</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
