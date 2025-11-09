export function getCookie(name) 
{
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
let access = getCookie('access_token');

export async function CheckAuthenticated()
{
    console.log('Checking authentication...');
    const res = await fetch('/check/',
    {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if (res.status === 401)
    {
        const res = await fetch('/token-refresh/', {
            method: "POST",
            credentials: 'include',
            headers:
            {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify
            ({
                refresh: getCookie('refresh_token'),
            })
        });
        if (res.status === 401)
        {
            console.error('Failed to refresh token. Logging out...');
            deleteCookie('access_token');
            deleteCookie('refresh_token');
            deleteCookie('username');
            return false;
        }
        else if (res.status === 200)
        {
            const data = await res.json();
            access = getCookie('access_token');
            return true;
        }
        else
        {
            console.log('Not Authenticated');
            return false;
        }
    }
    else
    {
        console.log('Authenticated');
        return true;
    }
}

export function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}