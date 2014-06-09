function paramGet(sP)
{
	var url,vars,i,v;	
	url = window.location.search.substring(1);
	vars = url.split('&');
	for(i=0;i<vars.length;i++)
	{
	  v = vars[i].split('=');
		if (v[0]==sP)
		{
			return v[1];	
		}
	}
}