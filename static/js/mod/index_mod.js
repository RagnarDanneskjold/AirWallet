var QRCodeImage;

function qrCodeDecoder()
{
  var img = $('#theImageField');
  var canvas = document.getElementById('theCanvasField');
  var canvas = document.createElement('canvas');
  canvas.width = 2000;
  canvas.height = 2000;

  //var canvas = document.getElementById('theCanvasField');
  var originalContext = canvas.getContext('2d');
  originalContext.imageSmoothingEnabled = false;
  originalContext.webkitImageSmoothingEnabled = false;
  originalContext.mozImageSmoothingEnabled = false;


  var loops = 0;
  var image = new Image();
  image.onload = function ()
  {
    console.log($("#theImageField").attr("src"));
    loops++;
    if (loops < 4)
    {
      var w2 = this.width;
      var h2 = this.height;
      if (this.width > 800)
      {
        w2 *= 0.7;
        h2 *= 0.7;
        console.log(this.width, w2, this.height, h2);
      }
      else
      {
        loops = 4;
      }
      originalContext.clearRect(0, 0, canvas.width, canvas.height);
      originalContext.drawImage(this, 0, 0, this.width, this.height, 0, 0, w2, h2);
      var dataURL = canvas.toDataURL();
      this.src = dataURL;
    }
    else
    {
      var dataURL = canvas.toDataURL();
      qrcode.callback = ShowDecodedQR;
      qrcode.decode(dataURL);
    }
  };

  image.src = $("#theImageField").attr("src");
}

function ShowDecodedQR(data)
{
  QRScanLoading(false);
  if (data == 'error decoding QR Code')
  {
    alert("Unable to read the QR code!\n\nPlease try again");
  }
  else
  {
    $('#txDest1').val(data);
  }
}

function QRScanLoading(state)
{
  // is loading
  if (state)
  {
    $('.overlay_file_loading').css(
    {
      'display': 'block'
    });
  }
  else
  {
    //$('#theImageField').css({'display':'block'});
    $('.overlay_file_loading').css(
    {
      'display': 'none'
    });
  }
}
//Credit: https://www.youtube.com/watch?v=EPYnGFEcis4&feature=youtube_gdata_player
function getPic(event)
{
  if (event.target.files.length == 1 && event.target.files[0].type.indexOf("image/") == 0)
  {
    QRScanLoading(true);
    $("#theImageField").attr("src", URL.createObjectURL(event.target.files[0]));
    setTimeout(function ()
    {
      qrCodeDecoder()
    }, 100);
  }
  else
  {
    alert("There was a problem getting the scan.");
  }
}



function isMobile()
{
  var check = false;
  (function (a)
  {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function setCoinDecimals()
{
  for (var prop in currencyData)
  {
    if (currencyData[prop].coindecimals == 'auto')
    {
      currencyData[prop].coindecimals = currencyData[prop].coinfactor.toString().length - 1;
    }
  }
}

function setupCurrencySelection()
{
  $('.top-currency-dropdown').html('');
  $('#help_donate').html('');
  var short, long, active, donate;
  for (var prop in currencyData)
  {
    short = currencyData[prop].currency_short.toLowerCase();
    long = currencyData[prop].currency_long;
    donate = currencyData[prop].donateAddress;

    if (prop.toUpperCase() == selectedCurrency.toUpperCase())
    {
      active = ' class="active"';
    }
    else
    {
      active = '';
    }
    $('.top-currency-dropdown').append('<li' + active + '><a href="#/' + short.toLowerCase() + '" class="currency-dd-item">' + long + '</a></li>');
    $("#help_donate").append(prop + ': <a href="bkchain.html#/' + short.toLowerCase() + '/address/' + donate + '">' + donate + '</a><br style="clear:both;"/>');
  }
}

function getHashTag()
{
  var hash = window.location.hash;
  if (hash == '')
  {
    return;
  }
  hash = hash.substr(2).toUpperCase();
  if (typeof currencyData[hash] != 'undefined')
  {
    selectedCurrency = hash;
    return true;
  }
  return false;
}

function setCurrencySelection()
{
  // Updates our selectedCurrency to whatever the browser is initiated with.
  getHashTag();
	
	var d=0;
	if (typeof currency_short != 'undefined'){d=1;}
	
  address_version = currencyData[selectedCurrency].address_version;
  currency_short = currencyData[selectedCurrency].currency_short;
  currency_long = currencyData[selectedCurrency].currency_long;
  coinfactor = currencyData[selectedCurrency].coinfactor;
  coindecimals = currencyData[selectedCurrency].coindecimals;
  donateAddress = currencyData[selectedCurrency].donateAddress;
  defaultFees = currencyData[selectedCurrency].defaultFees;

  current_currency = currency_short.toLowerCase();
  script_name = '#/' + current_currency;
	
	if (d){ if (loadNewCurrency){ $('#address-tree').treetable("unloadBranch", $('#address-tree').treetable("node", 2)); 
	$('#address-tree').treetable("unloadBranch", $('#address-tree').treetable("node", 3)); 
	loadNewCurrency(); } }
}

function applyCurrencySelection()
{
  // global replace top link into selected currency
  $('.update-top-link').attr('href', '#/' + current_currency).html(currency_long + ' <b class="caret"></b>');

  setupCurrencySelection();

  $('#search').attr('placeholder', 'block id, block hash, transaction hash or address (' + currency_short + ')');
}

function main_search()
{
  window.location = 'bkchain.html?search=' + $('#search').val();
}