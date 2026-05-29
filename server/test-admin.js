import fetch from "node-fetch";

async function testAdmin() {
  const url = "https://pghhlvcsldqxhuicitxr.supabase.co";
  const key = "YOUR_SUPABASE_SERVICE_ROLE_KEY";
  
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data.users ? data.users.length : data);
}

testAdmin();
