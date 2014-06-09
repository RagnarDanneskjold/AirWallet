var has_loggedIn = false;
var wallet = new function ()
{
  var receiving_interval = 5;
  var change_interval = 3;

	//var has_loggedIn = false;
	
  var init_completed = 0;

  var nextNodeIndex = 5;

  var receiving_keys = [];
  var change_keys = [];
	
  function send_alert(alertType, message)
  {
    var alertItem = $('<div class="alert ' + alertType + ' alert-dismissable">' + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + message + '</div>');
    $('#wallet-alert-div').append(alertItem);
  }

  function query_url(url, onSuccess, onError)
  {
    $.ajax(
    {
      url: url,
      success: function (res)
      {
        onSuccess(res);
      },
      error: function (xhr, opt, err)
      {
        if (onError)
          onError(err);
      }
    });
  }

  function get_keys()
  {
    return receiving_keys.concat(change_keys);
  }

  function prepareTx()
  {
    var addr = $('#txDest1').val();
    var amount = Math.round(parseFloat($('#txValue1').val()) * coinfactor);
    var fees = Math.round(parseFloat($('#txFees').val()) * coinfactor);
    var donate = Math.round(parseFloat($('#txDonate').val()) * coinfactor);

    var total = 0;
    var valid = false;

    var keys = get_keys();

    var inputKeys = [];

    // Find enough addresses to cover those funds
    // TODO: User-specified addresses?
    for (var i = 0; i < keys.length; ++i)
    {
      var key = keys[i];
      total += key.balance;
      inputKeys.push(key);
      if (total >= amount + fees + donate)
      {
        valid = true;
        break;
      }
    }

    if (!valid)
    {
      $('#txJSON').val("error: Not enough funds");
      return false;
    }

    // Query unspent outputs
    query_url("https://bkchain.org/" + current_currency + "/api/v1/address/unspent/" + inputKeys.map(function (x)
    {
      return x.address
    }).join() + "?confirmations=0", function (unspent_results)
    {
      var inputs = [];
      var total = 0;
      var valid = false;

      // Find enough inputs to cover those funds
      for (var i = 0; i < unspent_results.length; ++i)
      {
        var unspent_address = unspent_results[i];
        for (var j = 0; j < unspent_address.unspent.length; ++j)
        {
          var unspent_output = unspent_address.unspent[j];
          total += unspent_output.v;
          inputs.push(
          {
            output: unspent_output,
            address: unspent_address.address
          });
          var script = new Bitcoin.Script(Crypto.util.hexToBytes(unspent_output.script));
          if (total >= amount + fees + donate)
          {
            valid = true;
            break;
          }
        }
      }

      // We could find enough funds from address but when checking unspent outputs it didn't match?
      // Either something changed on us in the meantime (could happen) or it's a bug.
      if (!valid)
      {
        $('#txJSON').val("error: Not enough funds (could not find unspent outputs)");
        return;
      }

      var change = total - amount - fees - donate;

      TX.parseInputsBKC(inputs);
			//var keysMapped = keys.map(function (x){ return x.eckey; });
      
			TX.initMultiple( keys.map(function (x){ return x.eckey; }) );

      // Main output
      TX.addOutput(addr, amount);

      // Change
      if (change > 0)
      {
        // Default: select first element
        var changeAddr = change_keys[0].address;
        for (var i = 0; i < change_keys.length; ++i)
        {
          var key = change_keys[i];
          if (key.txcount == 0)
          {
            changeAddr = key.address;
            break;
          }
        }

        TX.addOutput(changeAddr, change);
      }

      // Donation
      if (donateAddress !== "" && donate > 0)
        TX.addOutput(donateAddress, donate);
				
				
				
			try
      {
        var sendTx = TX.construct();
        var txJSON = TX.toBBE(sendTx);
        var buf = sendTx.serialize();
        var txHex = Crypto.util.bytesToHex(buf);

        $('#txJSON').val(txJSON);
        $('#txHex').val(txHex);

        $('#sendPayment').addClass('btn-primary');
        $('#sendPayment').removeAttr('disabled');
      }
      catch (e)
      {
        if (e instanceof BitcoinAddressException)
        {
          $('#txJSON').val("Address error: " + e.message);
        }
        else
        {
          $('#txJSON').val("TX error: " + e);
        }
      }
    });
  }

  function addressRefreshLoop()
  {
    addressRefresh();
  }
	
  function initialize_table(mode, keys, table_id)
  {		
		var parentNode = $('#address-tree').treetable("node", mode == 0 ? "2" : "3"), keyStart;
    		parentNode.expand();
    		keyStart = keys.length;
				
    var receivedBalances = 0;
    var interval = mode == 0 ? receiving_interval : change_interval;
    //var interval = 1;

    Electrum.gen(mode, keyStart, keyStart + interval, function (r)
    {
      var key = {
        eckey: new Bitcoin.ECKey(r[1]),
        address: r[0],
				cT: currency_short
      }
      var keyIndex = keys.length;
      keys.push(key);
      // Expand parent nodes
      
      var nodeIndex = nextNodeIndex++;
			
			
      var wrap = '<input onclick="this.select();this.selectionStart=0;this.selectionEnd=this.value.length;" type="text" class="address_hide" value="' + key.address + '"><div class="address_hide_note">...</div>';
      var newItem = $('<tr data-tt-id="' + nodeIndex + '" data-tt-parent-id="' + (mode == 0 ? 2 : 3) + '"><td class="text-left address">' + wrap + '</td><td><span class="glyphicon glyphicon-qrcode" rel="popover" data-container="body" data-toggle="popover" data-placement="auto bottom"></span></td><td class="text-center address-balance">...</td><td class="text-center address-tx">...</td></tr>');
      $('#address-tree').treetable("loadBranch", parentNode, newItem);
      newItem.qrcode_loaded = false;



      if (isMobile())
      {
        newItem.find("[rel=popover]").click(function ()
        {
          //var win = window.open("about:blank","QRCode");	
          var canvas = ninja.qrCode.createCanvas(key.address, 5);

          var mainCanvas = document.getElementById("mainSrc");

          var win = window.open('', 'windowName', "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=680, height=680, top=0, left=0");
          var winDoc = win.document;

          var img = '<div id="address">' + key.address + '</div><div id="qrcode"><img src="' + canvas.toDataURL() + '" /></div>';
          var page = '<!DOCTYPE html><html><head><title>' + key.address + '</title>' + '<style>body{text-align:center;} #address {font-weight: bold; } #qrcode img { width: 100%; }</style></head><body>' + img + '</body></html>';
          winDoc.write(page);
        });
      }
      else
      {
        newItem.find("[rel=popover]").popover(
        {
          html: true,
          title: function ()
          {
            return 'QR Code';
          },
          content: function ()
          {
            if (!newItem.qrcode_loaded)
            {
              newItem.qrcode_loaded = true;
              return ninja.qrCode.createCanvas(key.address, 5);
            }
          }
        });
      }

      key.item = newItem;
      key.nodeIndex = nodeIndex;

      if (++receivedBalances == interval)
      {
        // Send balance query
        query_url("https://bkchain.org/" + current_currency + "/api/v1/address/balance/" + keys.slice(keys.length - interval, keys.length).map(function (x)
        {
          return x.address
        }).join() + "?confirmations=0", function (balance_results)
        {
          var hasTx = false;
          for (var i = 0; i < interval; ++i)
          {
            var balance_result = balance_results[i];
            var key = keys[keys.length - interval + i];
            hasTx = hasTx || balance_result.txcount > 0;

            key.balance = balance_result.balance;
            key.txcount = balance_result.txcount;

            if (key.balance == 0 && key.txcount > 0)
            {
              // Strike used addresses
              var addrElt = key.item.find('td.address').first();
              addrElt.wrapInner("<strike>");
              key.striked = true;
            }

            key.item.find('td.address-balance').first().text(balance_result.balance / coinfactor);
            key.item.find('td.address-tx').first().html('<a href="bkchain.html' + script_name + '/address/' + key.address + '" target="_blank">' + balance_result.txcount + '</a>');
          }

          var total_balance = 0;
          var all_keys = get_keys();
          for (var i = 0; i < all_keys.length; ++i)
          {
            if (all_keys[i].hasOwnProperty('balance'))
              total_balance += all_keys[i].balance;
          }

          $('#total-balance').text(total_balance / coinfactor);

          if (hasTx)
          {
            // If one balance has tx, request another batch
            // TODO: Use setTimeout?
            initialize_table(mode, keys, table_id);
          }
          else if (++init_completed == 2)
          {
            $('#address-refresh-icon').fadeOut();
            $('#address-refresh').removeAttr('disabled');
            setInterval(addressRefresh, 60000);
          }
        });
      }
    });
  }

  function initialize()
  {
    init_completed = 0;
		
		has_loggedIn = true;
		
		$('#amount-prepend-text').text('Amount (' + currency_short + ')');
		$('#fees-prepend-text').text('Fees (' + currency_short + ')');
		$('#donate-prepend-text').text('Donate (' + currency_short + ')');
		
		//console.log(receiving_keys);
		//console.log(receiving_keys);

    // Initialize chains for both receiving and change addresses
		receiving_keys = [];//new Array();
		
    initialize_table(0, receiving_keys, '#address-tree-body');
		
		change_keys = [];//new Array();
    initialize_table(1, change_keys, '#address-tree-body');
  }



  function addressRefresh()
  {
    $('#address-refresh-icon').fadeIn();

    var keys = get_keys();
    var total_balance = 0;
    query_url("https://bkchain.org/" + current_currency + "/api/v1/address/balance/" + keys.map(function (x)
    {
      return x.address
    }).join() + "?confirmations=0", function (balance_results)
    {
      for (var i = 0; i < balance_results.length; ++i)
      {
        var balance_result = balance_results[i];

        var key = keys[i];
        key.balance = balance_result.balance;
        key.txcount = balance_result.txcount;
        key.item.find('td.address-balance').first().text(balance_result.balance / coinfactor);
        key.item.find('td.address-tx').first().html('<a href="' + script_name + '/address/' + key.address + '" target="_blank">' + balance_result.txcount + '</a>');

        if (!key.hasOwnProperty('striked') && key.balance == 0 && key.txcount > 0)
        {
          // Strike used addresses
          var addrElt = key.item.find('td.address').first();
          addrElt.wrapInner("<strike>");
          key.striked = true;
        }

        total_balance += key.balance;
      }
      $('#address-refresh-icon').fadeOut();
      $('#total-balance').text(total_balance / coinfactor);
    });
  }

  function sendTx()
  {
    var txHex = $('#txHex').val();
    $.post("https://bkchain.org/" + current_currency + "/api/v1/tx/push",
      JSON.stringify(
      {
        hexdata: txHex
      }),
      function (data)
      {
        if (data === "exception")
        {
          send_alert('alert-danger', '<strong>Error!</strong> Transaction failed!');
        }
        else
        {
          send_alert('alert-success', '<strong>Good!</strong> Transaction sent, id: <a href="bkchain.html' + script_name + '/tx/' + data + '" target="_blank">' + data + '</a>');
        }

        // Wait a few seconds before refreshing balances
        setTimeout(addressRefresh(), 2000);
      });
    return true;
  }

  this.prepareTx = prepareTx;
  this.sendTx = sendTx;
  this.initialize = initialize;
  this.addressRefresh = addressRefresh;
}

function generatePassword()
{

  $('#electrum-seed-generator').fadeIn();
  //$('#electrum-generated-seed').electrum-generated-seed


  var pk = new Array(32);
  rng_get_bytes(pk);
  var seed = Crypto.util.bytesToHex(pk.slice(0, 16));
  //nb! electrum doesn't handle trailing zeros very well
  // and we want to stay compatible.
  if (seed.charAt(0) == '0') seed = seed.substr(1);
  var codes = mn_encode(seed);
  $('#electrum-generated-seed').val(codes);

  $('#electrum-generated-seed').click(function ()
  {
    this.select();
    this.selectionStart = 0;
    this.selectionEnd = this.value.length;
  });

  return false;
}

function checkValidPassword()
{
  var electrumSeed = $('#electrum-seed').val();
  var valid = true;

  // Otherwise, check for electrum seed
  if (electrumSeed.split(' ').length != 12)
    valid = false;

  //make sure each word is a valid one from elctrum poetry list (mn_words variable)
  electrumSeed.split(' ').forEach(function (word)
  {
    if (mn_words.indexOf(word) == -1)
    {
      valid = false;
    }
  });

  // It could still be a public key
  if (!valid && electrumSeed.match(/^[a-zA-Z0-9]{128}$/))
    valid = true;


  if (valid)
  {
    $('#open-wallet').addClass('btn-primary');
    $('#open-wallet').removeAttr('disabled');
    $('#electrum-seed-generator').hide();
  }
  else
  {
    $('#open-wallet').removeClass('btn-primary');
    $('#open-wallet').attr('disabled', 'disabled');
  }
}

function loadNewCurrency()
{
	if (typeof wallet == 'undefined' || !has_loggedIn){ return; }
	
  wallet.initialize();
  //$("#scanField").on("change",getPic);

  if (donateAddress === "")
  {
    $('#donate-div').hide();
  }

  $('#txFees').val(defaultFees);
  $('#amount-prepend-text').text('Amount (' + currency_short + ')');
  $('#fees-prepend-text').text('Fees (' + currency_short + ')');
  $('#donate-prepend-text').text('Donate (' + currency_short + ')');
}

$(document).ready(function ()
{

  $("#scanField").on("change", getPic);

  if (donateAddress === "")
  {
    $('#donate-div').hide();
  }

  $('#wallet-div').hide();
  $('#payment-div').hide();
  $('#publickey-div').hide();

  // Update navigation bar when clicked  
  $(document).ready(function ()
  {
    $('#wallet-menu-div > ul.nav > li').click(function (e)
    {
      e.preventDefault();
      $('#wallet-menu-div > ul.nav > li').removeClass('active');
      $(this).addClass('active');
    });
  });

  $('#addresses-nav').click(function ()
  {
    $('#payment-div').hide();
    $('#publickey-div').hide();
    $('#addresses-div').show();
  });

  $('#payment-nav').click(function ()
  {
    $('#addresses-div').hide();
    $('#publickey-div').hide();
    $('#payment-div').show();
  });

  $('#publickey-nav').click(function ()
  {
    $('#addresses-div').hide();
    $('#payment-div').hide();
    $('#publickey-div').show();
  });

  $('#signout-nav').click(function ()
  {
    if (!confirm("Are you sure you want to signout?")) return false;
    window.location = "index.html"
  });

  $('#txSend').click(function ()
  {
    $('#txJSON').val('');
    $('#txHex').val('');
    $('#sendPayment').attr('disabled', 'disabled');
    $('#sendPayment').removeClass('btn-primary');
    $('#verifyModal').modal();
    $('#txJSON').val("Creating transaction, please wait...");
    wallet.prepareTx();
  });

  $('#sendPayment').click(wallet.sendTx);

  $('#address-refresh').click(wallet.addressRefresh);

  // Update button on keypress
  // Also update button on change (mobile device seem to not do a keyup in those cases)
  $('#electrum-seed').change(checkValidPassword);
  $('#electrum-seed').keyup(checkValidPassword);

  $('#electrum-seed').click(checkValidPassword);
  //$('#electrum-seed').focus(checkValidPassword);

  $('#generate-seed').click(generatePassword);

  $('#address-refresh-icon').hide();

  $('#address-tree').treetable(
  {
    expandable: true
  });
  $('#address-tree').treetable("node", "1").expand();

  $('#open-wallet-progress').hide();
  $('#electrum-seed-generator').hide();

  $('#txFees').val(defaultFees);

  $('#open-wallet').click(function ()
  {

    // hide the signin stuff.
    $('#open-wallet-signin').hide();

    // show loading stuff
    $('#open-wallet-loading').show();
    $('#open-wallet-progress').show();

    // reset the "generated" pass for security.
    $('#electrum-generated-seed').val('');

    var electrumSeed = $('#electrum-seed').val();

    // Public key?
    if (electrumSeed.match(/^[a-zA-Z0-9]{128}$/))
    {
      var pubKey = Crypto.util.hexToBytes(electrumSeed);
      pubKey.unshift(4);
      $('#electrum-publickey').text(Crypto.util.bytesToHex(pubKey.slice(1)));
      Electrum.initPublic(pubKey);
      $('#payment-nav').hide();
      $('#welcome-div').hide();
      $('#wallet-div').show();
      $('#address-refresh-icon').fadeIn();

      // Because of the previous hide, sub node start as hidden, let's "force" refresh it.
      $('#address-tree').treetable("node", "1").collapse();
      $('#address-tree').treetable("node", "1").expand();
      wallet.initialize();
    }
    else
    {
      electrumSeed = mn_decode(electrumSeed);

      Electrum.init(electrumSeed,
        function (r)
        {
          if (r % 10 == 0)
            $('#open-wallet-progress-bar').css('width', (r + 5) + '%');
        },
        function (privKey, pubKey)
        {
          $('#electrum-publickey').text(Crypto.util.bytesToHex(pubKey.slice(1)));
          $('#welcome-div').hide();
          $('#wallet-div').show();
          $('#address-refresh-icon').fadeIn();

          // Because of the previous hide, sub node start as hidden, let's "force" refresh it.
          $('#address-tree').treetable("node", "1").collapse();
          $('#address-tree').treetable("node", "1").expand();
          wallet.initialize();
        });
    }
    return false;
  })
})



/*
{
    "hash": "919eed813a113a5dee1e2ba503cd6caf9497429f1c236997febc033bb4f31368",
    "ver": 1,
    "vin_sz": 0,
    "vout_sz": 2,
    "lock_time": 0,
    "size": 78,
    "in": [],
    "out": [
        {
            "value": "1.00000000",
            "scriptPubKey": "OP_DUP OP_HASH160 603a267f6479983c4a56f74e97d63cbc635d65ba OP_EQUALVERIFY OP_CHECKSIG"
        },
        {
            "value": "993.99999966",
            "scriptPubKey": "OP_DUP OP_HASH160 949048ee0ef831b5641d6c65f74957e385f0a697 OP_EQUALVERIFY OP_CHECKSIG"
        }
    ]
}





{
    "hash": "0f5707f9337b8383bb27f828a95bcafc85808a071fb7bdf0a0a6d33e4e047c4f",
    "ver": 1,
    "vin_sz": 1,
    "vout_sz": 2,
    "lock_time": 0,
    "size": 257,
    "in": [
        {
            "prev_out": {
                "hash": "bd055159c76776ff7000f1e8fa843fa3a9e1e32cd93581576811ba74b888785d",
                "n": "1"
            },
            "scriptSig": "304402202f0b3b13e0333dd3086e9cf203b02d17733dd44fedab3589a9466b2edda605a1022020d3dd67c414d0d70cf0ccfa053a8b3d4bbf3b78e3030d92d2aadf7ca4d8d6e101 0477a62ed0c8153ceea8d97cc6846f370f3ba2b92f25d7febcb20696ef0ed4c1bcc32a7e38891f7f37dfd9cb7ae71010d191d5cb39c301dd5716a41dc0fc7a3962"
        }
    ],
    "out": [
        {
            "value": "1.00000000",
            "scriptPubKey": "OP_DUP OP_HASH160 557dc29ec4400d2e836eb81a833d99f44eb6c703 OP_EQUALVERIFY OP_CHECKSIG"
        },
        {
            "value": "993.99999966",
            "scriptPubKey": "OP_DUP OP_HASH160 949048ee0ef831b5641d6c65f74957e385f0a697 OP_EQUALVERIFY OP_CHECKSIG"
        }
    ]
}


*/